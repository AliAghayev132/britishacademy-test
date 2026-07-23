/**
 * Köhnə (legacy) media host-larının siyahısı.
 *
 * DB-də saxlanan TipTap HTML və müəyyən image field-lərində hələ də əvvəlki
 * server IP-si və ya köhnə domen ilə tam URL-lər ola bilər. Render zamanı
 * bu prefiksləri silərək nisbi (relative) yola çeviririk — beləliklə
 * cari `NEXT_PUBLIC_IMAGE_URL` (və ya brauzerin cari origin-i) avtomatik
 * tətbiq olunur.
 *
 * Əlavə host lazım olarsa `NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` env-ə vergüllə
 * ayrılmış şəkildə əlavə et:
 *   NEXT_PUBLIC_LEGACY_IMAGE_HOSTS=http://example.com,https://old.bdu.az
 */

// Bug #4: proyektə-xas hardcoded IP-lər buradan çıxarıldı. Köhnə data-nız
// mütləq URL saxlayırsa, onları `NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` (Next) və ya
// `VITE_LEGACY_IMAGE_HOSTS` (Vite) env ilə vergüllə ayrılmış şəkildə ver.
// Boş qaldıqda `normalizeContentHtml` sadəcə no-op olur.
const DEFAULT_LEGACY_HOSTS = [];

const envHosts = (process.env.NEXT_PUBLIC_LEGACY_IMAGE_HOSTS || "")
  .split(",")
  .map((h) => h.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const LEGACY_IMAGE_HOSTS = Array.from(
  new Set([...DEFAULT_LEGACY_HOSTS, ...envHosts]),
);

/**
 * Verilmiş URL legacy host-lardan biri ilə başlayırsa, host hissəsini silib
 * yerinə nisbi yol qaytarır. Əks halda dəyişmədən qaytarır.
 *
 * @param {string} url
 * @returns {string}
 */
export function stripLegacyHost(url) {
  if (!url || typeof url !== "string") return url;
  for (const host of LEGACY_IMAGE_HOSTS) {
    if (url.startsWith(host + "/")) return url.slice(host.length);
    if (url === host) return "/";
  }
  return url;
}
