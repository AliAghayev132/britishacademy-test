/**
 * HTTP keşləmə başlıqları.
 *
 * Əvvəl API heç bir `Cache-Control` göndərmirdi — nə brauzer, nə Nginx, nə də
 * CDN cavabları keşləyə bilirdi. `/api/home` hər açılışda ~10 baza sorğusu
 * icra edir; eyni məzmun üçün bunu saniyədə onlarla dəfə təkrarlamaq mənasızdır.
 *
 * Strategiya:
 *   • Public GET  → qısa keş + `stale-while-revalidate`. Ziyarətçi köhnəlmiş
 *     nüsxəni dərhal alır, arxa planda yenilənir; admin dəyişiklikləri
 *     `max-age` qədər gecikmə ilə görünür.
 *   • Qalan hər şey (admin, auth, POST/PUT/DELETE) → `no-store`. Şəxsi
 *     məlumatın ara serverlərdə qalmasının qarşısını alır.
 *
 * `Vary: Accept-Language, x-lang` vacibdir — eyni URL dilə görə fərqli məzmun
 * qaytarır, bu başlıq olmasa keş bir dili digərinə verə bilər.
 */

const PUBLIC_MAX_AGE = Number(process.env.PUBLIC_CACHE_SECONDS || 60);
const STALE_WINDOW = Number(process.env.PUBLIC_CACHE_STALE_SECONDS || 300);

/** Keşlənməməli yollar — istifadəçiyə xas və ya dəyişkən. */
const NEVER_CACHE = [/^\/api\/admin/, /^\/api\/auth/, /^\/api\/ai/];

export function cacheHeaders(req, res, next) {
  const isGet = req.method === "GET" || req.method === "HEAD";
  const isPrivate = NEVER_CACHE.some((re) => re.test(req.path));

  if (!isGet || isPrivate) {
    res.set("Cache-Control", "no-store");
    return next();
  }

  res.set(
    "Cache-Control",
    `public, max-age=${PUBLIC_MAX_AGE}, stale-while-revalidate=${STALE_WINDOW}`,
  );
  // Dil məzmunu dəyişdiyi üçün keş açarına daxil edilməlidir.
  res.set("Vary", "Accept-Language, x-lang");
  next();
}
