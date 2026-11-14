import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeJwtExp, isAccessTokenUsable, refreshAccessToken } from "./tokens";

/** Craft a JWT with an arbitrary payload (no signing — only exp is read). */
function fakeJwt(exp?: number): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({ exp, sub: "user" });
  return `${header}.${payload}.signature`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("decodeJwtExp", () => {
  it("reads the exp claim", () => {
    expect(decodeJwtExp(fakeJwt(1234567890))).toBe(1234567890);
  });

  it("returns null for missing/invalid tokens", () => {
    expect(decodeJwtExp(undefined)).toBeNull();
    expect(decodeJwtExp("garbage")).toBeNull();
    expect(decodeJwtExp("a.b")).toBeNull();
  });
});

describe("isAccessTokenUsable", () => {
  it("accepts tokens expiring more than 30s from now", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isAccessTokenUsable(fakeJwt(future))).toBe(true);
  });

  it("rejects expired, almost-expired and garbage tokens", () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    const almost = Math.floor(Date.now() / 1000) + 10; // inside 30s grace
    expect(isAccessTokenUsable(fakeJwt(past))).toBe(false);
    expect(isAccessTokenUsable(fakeJwt(almost))).toBe(false);
    expect(isAccessTokenUsable("garbage.token.here")).toBe(false);
    expect(isAccessTokenUsable(null)).toBe(false);
  });
});

describe("refreshAccessToken", () => {
  it("returns rotated tokens on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: "A", refresh: "R2" }),
      }),
    );
    const result = await refreshAccessToken("R1");
    expect(result).toEqual({ access: "A", refresh: "R2" });
  });

  it("keeps the old refresh token when the backend does not rotate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: "A" }),
      }),
    );
    const result = await refreshAccessToken("R1");
    expect(result).toEqual({ access: "A", refresh: "R1" });
  });

  it("returns null on failure (treated as a dead session)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    expect(await refreshAccessToken("bad")).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await refreshAccessToken("bad")).toBeNull();
  });
});
