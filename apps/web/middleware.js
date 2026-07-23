import { NextResponse } from 'next/server'

/**
 * Auth guard middleware.
 *
 * The RTK auth slice (see src/store/slices/authSlice.js) keeps the source of
 * truth for tokens in `localStorage`, which the Edge middleware cannot read.
 * To make server-side route protection possible, the client MIRRORS the access
 * token into a readable cookie named `token` on login/refresh and clears it on
 * logout. This middleware only checks for the presence of that mirrored cookie
 * to decide whether to allow access to protected routes.
 *
 * NOTE: This is a lightweight UX guard, not a security boundary. The real
 * authorization always happens on the API server, which validates the JWT.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Protect the dashboard area: unauthenticated users are sent to /login.
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Keep authenticated users out of the auth pages.
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Only run the middleware on the routes that need the guard.
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
