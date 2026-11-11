import {
  DEV_SECRET_DEFAULTS,
  findSecretProblems,
  assertProductionSecrets,
  getSecret,
} from "../secrets";

// exatamente 32 caracteres: o mínimo aceito
const strongEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "production",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "r".repeat(32),
  PUBLIC_ALIAS_SECRET: "p".repeat(32),
});

describe("production secrets", () => {
  const defects: Array<[string, (name: string) => string | undefined]> = [
    ["missing", () => undefined],
    ["shorter than 32 chars", () => "x".repeat(31)],
    ["equal to the dev default", (name) => DEV_SECRET_DEFAULTS[name as keyof typeof DEV_SECRET_DEFAULTS]],
  ];

  for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "PUBLIC_ALIAS_SECRET"]) {
    for (const [label, valueFor] of defects) {
      it(`rejects ${name} when ${label}`, () => {
        const env = strongEnv();
        const value = valueFor(name);
        if (value === undefined) delete env[name];
        else env[name] = value;

        const problems = findSecretProblems(env);

        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain(name);
        if (value) expect(problems[0]).not.toContain(value);
      });
    }
  }

  it("rejects nothing when all three are strong (32 chars is enough)", () => {
    expect(findSecretProblems(strongEnv())).toEqual([]);
  });

  it("exits 1 in production when a secret is bad", () => {
    const env = strongEnv();
    delete env.JWT_ACCESS_SECRET;
    const exit = jest.fn() as unknown as (code: number) => never;

    assertProductionSecrets(env, exit);

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("outside production: no exit without the variables and dev defaults are used", () => {
    const exit = jest.fn() as unknown as (code: number) => never;
    const env: NodeJS.ProcessEnv = { NODE_ENV: "development" };

    assertProductionSecrets(env, exit);

    expect(exit).not.toHaveBeenCalled();
    expect(getSecret("JWT_ACCESS_SECRET", env)).toBe("dev-access-secret-change-in-production");
  });

  it("getSecret returns the configured value over the dev default", () => {
    expect(getSecret("JWT_ACCESS_SECRET", { JWT_ACCESS_SECRET: "x" })).toBe("x");
  });
});
