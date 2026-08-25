import { NextResponse } from 'next/server'
import { buildPath, canonicalPath, localeOfPath, splitLocale } from '@/lib/i18n/routes'

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

  // ── Public dil aşkarlanması + slug tərcüməsi ──
  //
  // Hər dilin öz route-u var (/elaqe · /en/contact · /ru/kontakty). Daxili Next
  // route-ları KANONİK AZ formadadır, ona görə burada iki iş görülür:
  //   1) gələn URL kanonik forma çevrilib rewrite olunur (URL dəyişmir),
  //   2) səhv slug istifadə olunubsa 308 ilə düzgün URL-ə yönləndirilir —
  //      /en/elaqe → /en/contact. Beləcə eyni məzmun iki URL-də qalmır.
  const cookieLang = request.cookies.get('lang')?.value
  const { locale: prefixLang, path: stripped, prefixed } = splitLocale(pathname)

  // Prefikssiz gələn əcnəbi slug (/contact) → aid olduğu dilin URL-inə yönəlt.
  if (!prefixed) {
    const owner = localeOfPath(stripped, cookieLang)
    if (owner) {
      const url = request.nextUrl.clone()
      url.pathname = buildPath(canonicalPath(stripped), owner)
      return NextResponse.redirect(url, 308)
    }
  }

  const lang = prefixed
    ? prefixLang
    : (['az', 'en', 'ru'].includes(cookieLang) ? cookieLang : 'az')

  const canon = canonicalPath(stripped)

  // Prefiksli URL-də slug o dilə uyğun deyilsə — kanonik forma yönləndir.
  if (prefixed) {
    const expected = buildPath(canon, lang)
    if (expected !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = expected
      return NextResponse.redirect(url, 308)
    }
  }

  const headers = new Headers(request.headers)
  headers.set('x-lang', lang)

  // Rewrite yalnız URL daxili route-dan fərqlənəndə lazımdır.
  if (prefixed || canon !== pathname) {
    const url = request.nextUrl.clone()
    url.pathname = canon
    const res = NextResponse.rewrite(url, { request: { headers } })
    if (prefixed) res.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }
  return NextResponse.next({ request: { headers } })
}

// api/_next/static/faylları istisna et; qalan hər şeydə işlə (dashboard + public).
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)'],
}
