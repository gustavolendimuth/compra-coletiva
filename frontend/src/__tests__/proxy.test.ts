import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const run = (path: string, cookie?: string) =>
  proxy(
    new NextRequest(`http://localhost:5173${path}`, cookie ? { headers: { cookie } } : undefined)
  );

describe("proxy route protection", () => {
  it.each([
    ["redirects visitor without session from /admin to login modal", "/admin", undefined, "/campanhas?requireLogin=true&redirectTo=%2Fadmin"],
    ["redirects visitor without session from /perfil to login modal", "/perfil", undefined, "/campanhas?requireLogin=true&redirectTo=%2Fperfil"],
    ["session indicator auth-token=1 lets /perfil through", "/perfil", "auth-token=1", null],
    ["customer cookie on /admin is sent to campaigns with unauthorized error", "/admin", "auth-token=1; user-role=CUSTOMER", "/campanhas?error=unauthorized"],
    ["admin cookie lets /admin through", "/admin", "auth-token=1; user-role=ADMIN", null],
  ])("%s", (_label, path, cookie, expected) => {
    const location = run(path, cookie).headers.get("location");
    expect(location && location.replace("http://localhost:5173", "")).toBe(expected);
  });
});
