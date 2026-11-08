import { BoundedTtlCache } from "../boundedTtlCache";

describe("BoundedTtlCache", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("max entries: keeps at most maxEntries, evicting the oldest", () => {
    const cache = new BoundedTtlCache<string, number>({ maxEntries: 5000, ttlMs: 24 * 60 * 60 * 1000 });

    for (let i = 0; i < 5001; i += 1) cache.set(`k${i}`, i);

    expect(cache.size).toBe(5000);
    expect(cache.get("k0")).toBeUndefined();
    expect(cache.get("k1")).toBe(1);
    expect(cache.get("k5000")).toBe(5000);
  });

  it("max entries: overwriting an existing key does not evict", () => {
    const cache = new BoundedTtlCache<string, number>({ maxEntries: 2, ttlMs: 1000 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 3);
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBe(3);
    expect(cache.get("b")).toBe(2);
  });

  it("24h: entry older than ttl is gone, younger is kept", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const day = 24 * 60 * 60 * 1000;
    const cache = new BoundedTtlCache<string, number>({ maxEntries: 10, ttlMs: day });
    cache.set("a", 1);

    jest.setSystemTime(Date.now() + day - 1);
    expect(cache.get("a")).toBe(1);

    jest.setSystemTime(Date.now() + 2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});
