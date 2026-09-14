export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

/**
 * Paylaşıla bilən TAM ünvan.
 *
 * `NEXT_PUBLIC_SITE_URL` build zamanı verilməyəndə boş qalır — onda kopyalanan
 * mətn «/r/kod» olurdu, QR isə tamamilə yararsız çıxardı (nisbi ünvanı skaner
 * aça bilmir). Brauzerin öz origin-i həmişə düzgün domendir.
 */
export const fullUrl = (code) => {
  const base = SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/r/${code}`;
};

/** Kodu ünvana yararlı hala gətir — boşluq və AZ hərfləri linki sındırır. */
export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o")
    .replace(/ü/g, "u").replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
