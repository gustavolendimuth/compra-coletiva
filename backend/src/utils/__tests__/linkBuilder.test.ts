import crypto from "crypto";
import { LinkBuilder } from "../linkBuilder";

const legacyToken = (secret: string, userId: string, timestamp: number) =>
  `${crypto.createHmac("sha256", secret).update(`${userId}:${timestamp}`).digest("hex")}.${timestamp}`;

describe("unsubscribe token", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("is not JWT_SECRET based: valid under any JWT_SECRET, legacy HMACs rejected", () => {
    process.env.JWT_SECRET = "legacy-jwt-secret";
    const token = LinkBuilder.generateUnsubscribeToken("user-1");

    process.env.JWT_SECRET = "another-jwt-secret";
    expect(LinkBuilder.verifyUnsubscribeToken(token, "user-1")).toBe(true);

    const now = Date.now();
    expect(LinkBuilder.verifyUnsubscribeToken(legacyToken("another-jwt-secret", "user-1", now), "user-1")).toBe(false);
    expect(LinkBuilder.verifyUnsubscribeToken(legacyToken("default-secret-change-me", "user-1", now), "user-1")).toBe(false);
  });

  it("is not JWT_SECRET based: depends on JWT_ACCESS_SECRET (criterion 1 secret)", () => {
    process.env.JWT_ACCESS_SECRET = "a".repeat(40);
    const token = LinkBuilder.generateUnsubscribeToken("user-1");
    expect(LinkBuilder.verifyUnsubscribeToken(token, "user-1")).toBe(true);

    process.env.JWT_ACCESS_SECRET = "b".repeat(40);
    expect(LinkBuilder.verifyUnsubscribeToken(token, "user-1")).toBe(false);
    // chave derivada: HMAC com o JWT_ACCESS_SECRET cru não vale
    expect(LinkBuilder.verifyUnsubscribeToken(legacyToken("b".repeat(40), "user-1", Date.now()), "user-1")).toBe(false);
  });

  it("rejects a token for another user", () => {
    const token = LinkBuilder.generateUnsubscribeToken("user-1");
    expect(LinkBuilder.verifyUnsubscribeToken(token, "user-2")).toBe(false);
  });

  it("compares signatures with crypto.timingSafeEqual", () => {
    const spy = jest.spyOn(crypto, "timingSafeEqual");
    const token = LinkBuilder.generateUnsubscribeToken("user-1");

    expect(LinkBuilder.verifyUnsubscribeToken(token, "user-1")).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it("timingSafeEqual path: signature of different length returns false without throwing", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const [, timestamp] = LinkBuilder.generateUnsubscribeToken("user-1").split(".");
    expect(LinkBuilder.verifyUnsubscribeToken(`abc.${timestamp}`, "user-1")).toBe(false);
    expect(LinkBuilder.verifyUnsubscribeToken("garbage", "user-1")).toBe(false);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
