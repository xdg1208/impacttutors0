import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { refreshAccessToken } from "@/lib/tokens";

/**
 * Same-origin proxy for client-side API calls. The browser only ever talks
 * to this route, which forwards the httpOnly access_token cookie — no JWT
 * needs to be readable by client JavaScript.
 *
 * - Supports GET/POST/PUT/PATCH/DELETE.
 * - On 401 with a refresh cookie present, rotates tokens once and retries.
 * - Handles empty responses (e.g. 204 from bulk-delete) without erroring.
 */

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_MAX_AGE = 60 * 60;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

interface ProxyArgs {
  request: NextRequest;
  params: Promise<{ path: string[] }>;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

async function proxyRequest({ request, params, method }: ProxyArgs) {
  const { path } = await params;
  const url = `${API_BASE_URL}/${path.join("/")}/`;

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const hasBody = method !== "GET" && method !== "DELETE";
  const body = hasBody ? JSON.stringify(await request.json().catch(() => ({}))) : undefined;

  const doFetch = (token: string | undefined) =>
    fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // never send an empty auth header
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });

  let upstream: Response;
  try {
    upstream = await doFetch(accessToken);

    // Access token expired mid-session → rotate once and retry.
    if (upstream.status === 401 && refreshToken && accessToken) {
      const rotated = await refreshAccessToken(refreshToken);
      if (rotated) {
        accessToken = rotated.access;
        upstream = await doFetch(accessToken);

        const response = await buildJsonResponse(upstream);
        const secure = process.env.NODE_ENV === "production";
        response.cookies.set(ACCESS_COOKIE, rotated.access, {
          httpOnly: true, secure, sameSite: "lax", maxAge: ACCESS_MAX_AGE,
        });
        response.cookies.set(REFRESH_COOKIE, rotated.refresh, {
          httpOnly: true, secure, sameSite: "lax", maxAge: REFRESH_MAX_AGE,
        });
        return response;
      }
    }
  } catch {
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 502 });
  }

  return buildJsonResponse(upstream);
}

async function buildJsonResponse(upstream: Response): Promise<NextResponse> {
  // 204 No Content (and any other empty body) must not be parsed as JSON —
  // that previously turned successful bulk-deletes into fake 500s.
  const text = await upstream.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest({ request, params, method: "GET" });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest({ request, params, method: "POST" });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest({ request, params, method: "PUT" });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest({ request, params, method: "PATCH" });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest({ request, params, method: "DELETE" });
}
