import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// O Next só carrega o proxy que fica ao lado da pasta do app (aqui, src/). Um arquivo na
// raiz do frontend compila, passa no proxy.test.ts e nunca roda: foi o bug do middleware.ts.
describe("proxy file location", () => {
  const frontendRoot = resolve(__dirname, "../..");

  // O proxy.test importa ../proxy, então a existência de src/proxy.ts já está coberta
  it("app router lives in src/app and there is no stray middleware.ts / proxy.ts that Next would ignore or that would shadow the proxy", () => {
    expect(existsSync(resolve(frontendRoot, "src/app"))).toBe(true);
    const stray = ["middleware.ts", "proxy.ts", "src/middleware.ts"].filter((file) => existsSync(resolve(frontendRoot, file)));
    expect(stray).toEqual([]);
  });
});
