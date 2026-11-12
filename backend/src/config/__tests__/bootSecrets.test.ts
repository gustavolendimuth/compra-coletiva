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

  it("exits 1 naming the missing JWT_ACCESS_SECRET and the weak JWT_REFRESH_SECRET, and never prints the value", () => {
    const weak = "weak-refresh-value-123";
    const result = boot({ JWT_REFRESH_SECRET: weak, PUBLIC_ALIAS_SECRET: STRONG });
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("JWT_ACCESS_SECRET");
    expect(output).toContain("JWT_REFRESH_SECRET");
    expect(output).not.toContain(weak);
  });
});
