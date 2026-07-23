/**
 * Verilmiş şəkil URL-ini orijinal (optimallaşdırılmamış) versiyaya çevirir.
 *   /public/uploads/news/123-foo.jpg  →  /public/uploads/originals/news/123-foo.jpg
 *   https://api.../public/uploads/news/123-foo.jpg → ...originals/news/123-foo.jpg
 *
 * Sayt daxili olmayan (xarici) və ya yerli `/images/...` faylları üçün eyni URL qaytarılır,
 * çünki onlar üçün orijinal mövcud deyil.
 */
export function getOriginalImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("/uploads/originals/")) return url;
  if (url.includes("/uploads/")) {
    return url.replace(/\/uploads\//, "/uploads/originals/");
  }
  return url;
}

/**
 * Verilmiş URL-in orijinal nüsxəsi (sayt server-of-truth uploads-da yerləşən fayllar) ola
 * biləcəyini yoxlayır. Yalnız `/uploads/...` altındakı fayllar üçün true qaytarır.
 */
export function hasOriginalVariant(url) {
  return typeof url === "string" && /\/uploads\//.test(url);
}
