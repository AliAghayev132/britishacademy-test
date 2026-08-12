import { NextResponse } from 'next/server'

// URL prefiksli dillər: /en, /ru. AZ default-dur (prefikssiz).
const PREFIXED = ['en', 'ru']

/**
 * Proxy (middleware): auth guard + public dil aşkarlanması.
 *
 * 1) Auth: /dashboard mühafizə olunur; giriş edilməyibsə /login-ə yönləndirir.
 * 2) Dil: public route-larda /en, /ru prefiksi (və ya `lang` cookie) → `x-lang`
 *    request header-i; prefiks varsa daxili route-a rewrite (URL qalır).
 *    Admin (dashboard/login) AZ-only-dur, dil məntiqindən kənardır.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // ── Auth guard ──
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  // Admin sahəsi dil idarəçiliyindən kənardır.
  if (pathname.startsWith('/dashboard') || pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  // ── Public dil aşkarlanması ──
  const seg = pathname.split('/')[1]
  const cookieLang = request.cookies.get('lang')?.value

  let lang = 'az'
  let stripped = pathname
  let viaPrefix = false
  if (PREFIXED.includes(seg)) {
    lang = seg
    stripped = pathname.slice(seg.length + 1) || '/'
    viaPrefix = true
  } else if (['az', 'en', 'ru'].includes(cookieLang)) {
    lang = cookieLang
  }

  const headers = new Headers(request.headers)
  headers.set('x-lang', lang)

  let res
  if (viaPrefix) {
    const url = request.nextUrl.clone()
    url.pathname = stripped
    res = NextResponse.rewrite(url, { request: { headers } })
    res.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  } else {
    res = NextResponse.next({ request: { headers } })
  }
  return res
}

// api/_next/static/faylları istisna et; qalan hər şeydə işlə (dashboard + public).
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)'],
}
