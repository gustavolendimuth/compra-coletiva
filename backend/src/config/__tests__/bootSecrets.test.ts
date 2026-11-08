import { spawnSync } from "child_process";
import path from "path";

// Sobe o entrypoint real (src/index.ts) via tsx: a validação precisa rodar antes do listen
const backendDir = path.resolve(__dirname, "../../..");
const tsxCli = require.resolve("tsx/cli");

const STRONG = "k".repeat(40);

function boot(env: Record<string, string>) {
  return spawnSync(process.execPath, [tsxCli, "src/index.ts"], {
    cwd: backendDir,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      NODE_ENV: "production",
      PORT: "0",
      ENABLE_EMAIL_WORKER: "false",
      ...env,
    },
    encoding: "utf8",
    timeout: 60000,
  });
}

describe("boot with production secrets", () => {
  jest.setTimeout(90000);

  it("exits 1 naming JWT_ACCESS_SECRET when it is missing", () => {
    const result = boot({ JWT_REFRESH_SECRET: STRONG, PUBLIC_ALIAS_SECRET: STRONG });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("JWT_ACCESS_SECRET");
  });

  it("never prints the value of a weak JWT_REFRESH_SECRET and exits 1", () => {
    const weak = "weak-refresh-value-123";
    const result = boot({
      JWT_ACCESS_SECRET: STRONG,
      JWT_REFRESH_SECRET: weak,
      PUBLIC_ALIAS_SECRET: STRONG,
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("JWT_REFRESH_SECRET");
    expect(`${result.stdout}${result.stderr}`).not.toContain(weak);
  });
});
