import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

const run = (path: string, cookie?: string) =>
  middleware(
    new NextRequest(`http://localhost:5173${path}`, cookie ? { headers: { cookie } } : undefined)
  );

describe("middleware route protection", () => {
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
});
