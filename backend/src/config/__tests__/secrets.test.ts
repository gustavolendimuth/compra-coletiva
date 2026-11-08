import {
  REQUIRED_SECRETS,
  DEV_SECRET_DEFAULTS,
  findSecretProblems,
  assertProductionSecrets,
  getSecret,
} from "../secrets";

const STRONG = "s".repeat(32);

const strongEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: "production",
  JWT_ACCESS_SECRET: `${STRONG}-access`,
  JWT_REFRESH_SECRET: `${STRONG}-refresh`,
  PUBLIC_ALIAS_SECRET: `${STRONG}-alias`,
});

describe("production secrets", () => {
  it("lists exactly the three required secrets", () => {
    expect([...REQUIRED_SECRETS].sort()).toEqual(
      ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "PUBLIC_ALIAS_SECRET"].sort()
    );
  });

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

  it("rejects nothing when all three are strong", () => {
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
    for (const nodeEnv of ["development", "test", undefined]) {
      const env: NodeJS.ProcessEnv = nodeEnv ? { NODE_ENV: nodeEnv } : {};
      assertProductionSecrets(env, exit);
      expect(getSecret("JWT_ACCESS_SECRET", env)).toBe("dev-access-secret-change-in-production");
      expect(getSecret("JWT_REFRESH_SECRET", env)).toBe("dev-refresh-secret-change-in-production");
      expect(getSecret("PUBLIC_ALIAS_SECRET", env)).toBe("dev-public-alias-secret-change-in-production");
    }
    expect(exit).not.toHaveBeenCalled();
  });
});
