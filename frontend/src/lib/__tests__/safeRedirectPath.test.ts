import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "../safeRedirectPath";

describe("getSafeRedirectPath", () => {
  it.each(["/perfil", "/admin/usuarios", "/campanhas?x=1"])("aceita caminho interno %s", (path) => {
    expect(getSafeRedirectPath(path)).toBe(path);
  });

  it.each([null, undefined, "", "perfil", "https://evil.com", "//evil.com", "/\\evil.com"])(
    "recusa %s",
    (value) => {
      expect(getSafeRedirectPath(value)).toBeNull();
    }
  );

  // O navegador remove tab/quebra de linha e trata "\" como "/": "/\t/evil.com" vira "//evil.com"
  it.each(["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/\t\\evil.com"])(
    "recusa %j, que o navegador resolve para outro domínio",
    (value) => {
      expect(getSafeRedirectPath(value)).toBeNull();
    }
  );
});
