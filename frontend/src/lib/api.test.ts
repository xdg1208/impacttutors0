import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * getBaseUrl is module-private but evaluated at import time against
 * NEXT_PUBLIC_API_URL, so each case re-imports the module with a fresh env.
 */
async function importBaseUrl(envValue: string | undefined) {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (envValue !== undefined) {
    vi.stubEnv("NEXT_PUBLIC_API_URL", envValue);
  } else {
    delete process.env.NEXT_PUBLIC_API_URL;
  }
  const mod = await import("./api");
  return mod.API_BASE_URL;
}

afterEach(() => {
  vi.resetModules();
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe("API_BASE_URL", () => {
  it("defaults to the local dev API", async () => {
    expect(await importBaseUrl(undefined)).toBe("http://localhost:8000/api");
  });

  it("keeps an already-correct /api URL", async () => {
    expect(await importBaseUrl("https://backend.example.com/api")).toBe(
      "https://backend.example.com/api",
    );
  });

  it("appends /api to a bare domain", async () => {
    expect(await importBaseUrl("https://backend.example.com")).toBe(
      "https://backend.example.com/api",
    );
  });

  it("handles an api.* subdomain host (regression: naive includes() failed here)", async () => {
    expect(await importBaseUrl("https://api.example.com")).toBe(
      "https://api.example.com/api",
    );
  });

  it("normalizes trailing slashes", async () => {
    expect(await importBaseUrl("https://backend.example.com/api/")).toBe(
      "https://backend.example.com/api",
    );
  });
});
