import { API_BASE_URL } from "@/lib/api";

/**
 * Token helpers shared by proxy.ts (page requests) and the /api/[...path]
 * route (client fetches) — both spots need to detect an expired access
 * token and transparently rotate it via the refresh cookie.
 */

/** Decode the `exp` claim of a JWT without verification (backend verifies). */
export function decodeJwtExp(token: string | undefined | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(json);
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

/** True when the access token is missing, undecodable, or within 30s of expiry. */
export function isAccessTokenUsable(token: string | undefined | null): boolean {
  const exp = decodeJwtExp(token);
  return exp !== null && exp * 1000 > Date.now() + 30_000;
}

export interface RefreshedTokens {
  access: string;
  refresh: string;
}

/**
 * Exchange a refresh token for a new access token. The backend rotates
 * refresh tokens, so the response refresh token (when present) must replace
 * the old cookie. Returns null on any failure — treat the session as dead.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshedTokens | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access) return null;
    return { access: data.access, refresh: data.refresh ?? refreshToken };
  } catch {
    return null;
  }
}
