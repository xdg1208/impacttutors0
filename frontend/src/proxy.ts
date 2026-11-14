import { NextResponse, type NextRequest } from 'next/server'
import { isAccessTokenUsable, refreshAccessToken, type RefreshedTokens } from '@/lib/tokens'

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'

const ACCESS_MAX_AGE = 60 * 60          // matches backend ACCESS_TOKEN_LIFETIME
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7 // matches backend REFRESH_TOKEN_LIFETIME

function setAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set(ACCESS_COOKIE, tokens.access, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: ACCESS_MAX_AGE,
  })
  response.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    httpOnly: true, secure, sameSite: 'lax', maxAge: REFRESH_MAX_AGE,
  })
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  let effectiveAccess = accessToken
  let rotation: RefreshedTokens | null = null
  let sessionDead = false

  // Client-side fetches go through /api/[...path], which performs its own
  // refresh-and-retry — refreshing here too would double-rotate the token.
  // Page requests instead refresh here, BEFORE rendering, so server
  // components see a valid token instead of bouncing the user to /login.
  if (!pathname.startsWith('/api/') && !isAccessTokenUsable(accessToken) && refreshToken) {
    rotation = await refreshAccessToken(refreshToken)
    if (rotation) {
      effectiveAccess = rotation.access
    } else {
      sessionDead = true // refresh token invalid/expired — session over
    }
  }

  // No usable session and trying to access the dashboard → login.
  // Checks validity (not mere presence): a present-but-expired/garbage
  // cookie must behave exactly like no cookie, or /login <-> /dashboard
  // redirect loops become possible.
  if (isDashboardRoute && !isAccessTokenUsable(effectiveAccess)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    const redirect = NextResponse.redirect(url)
    if (sessionDead) clearAuthCookies(redirect)
    return redirect
  }

  // Usable session and trying to access auth pages → dashboard
  if (isAuthRoute && isAccessTokenUsable(effectiveAccess)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Build the response; when we rotated tokens, also rewrite the downstream
  // request cookies so THIS render already sees the fresh access token.
  const response = rotation
    ? (() => {
        const headers = new Headers(request.headers)
        const cookieJar = new Map(request.cookies.getAll().map(c => [c.name, c.value] as const))
        cookieJar.set(ACCESS_COOKIE, rotation!.access)
        cookieJar.set(REFRESH_COOKIE, rotation!.refresh)
        headers.set(
          'cookie',
          [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
        )
        return NextResponse.next({ request: { headers } })
      })()
    : NextResponse.next()

  if (rotation) setAuthCookies(response, rotation)
  if (sessionDead) clearAuthCookies(response)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
