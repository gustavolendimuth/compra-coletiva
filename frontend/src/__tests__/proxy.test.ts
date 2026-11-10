import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const run = (path: string, cookie?: string) =>
  proxy(
    new NextRequest(`http://localhost:5173${path}`, cookie ? { headers: { cookie } } : undefined)
  );

describe("proxy route protection", () => {
  it.each(["/admin", "/perfil"])("redirects visitor without session from %s to login modal", (path) => {
    const res = run(path);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/campanhas");
    expect(location.searchParams.get("requireLogin")).toBe("true");
    expect(location.searchParams.get("redirectTo")).toBe(path);
  });

  it("session indicator auth-token=1 lets /perfil through", () => {
    const res = run("/perfil", "auth-token=1");
    expect(res.headers.get("location")).toBeNull();
  });

  it("customer cookie on /admin is sent to campaigns with unauthorized error", () => {
    const res = run("/admin", "auth-token=1; user-role=CUSTOMER");
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/campanhas");
    expect(location.searchParams.get("error")).toBe("unauthorized");
  });

  it("admin cookie lets /admin through", () => {
    const res = run("/admin", "auth-token=1; user-role=ADMIN");
    expect(res.headers.get("location")).toBeNull();
  });
});
