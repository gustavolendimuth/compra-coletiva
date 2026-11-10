import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// O Next só carrega o proxy que fica ao lado da pasta do app (aqui, src/). Um arquivo na
// raiz do frontend compila, passa no proxy.test.ts e nunca roda: foi o bug do middleware.ts.
describe("proxy file location", () => {
  const frontendRoot = resolve(__dirname, "../..");

  it("app router lives in src/app", () => {
    expect(existsSync(resolve(frontendRoot, "src/app"))).toBe(true);
  });

  it("proxy is in src/, next to the app router", () => {
    expect(existsSync(resolve(frontendRoot, "src/proxy.ts"))).toBe(true);
  });

  it.each(["middleware.ts", "proxy.ts", "src/middleware.ts"])(
    "no stray %s that Next would ignore or that would shadow the proxy",
    (file) => {
      expect(existsSync(resolve(frontendRoot, file))).toBe(false);
    }
  );
});
