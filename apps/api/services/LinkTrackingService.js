import crypto from "node:crypto";
// Models
import { ShortLink, LinkClick } from "#models";

/**
 * Qısa link kliklərinin qeydiyyatı.
 *
 * Ziyarətçi /r/<kod> ünvanına girir → burada klik yazılır və hədəf qaytarılır.
 * Yönləndirmənin özü Next tərəfindədir ki, link saytın öz domenində qalsın.
 *
 * ŞƏXSİ MƏLUMAT: IP heç vaxt saxlanılmır. Unikal ziyarətçini ayırd etmək üçün
 * IP + User-Agent + gündəlik duz heşlənir. Duz hər gün dəyişdiyi üçün heş
 * uzunmüddətli izləməyə yaramır — yalnız «bu gün eyni adamdır?» sualına cavab
 * verir, GDPR baxımından ən az müdaxiləli variantdır.
 */

/** Duz — serverin gizli açarı + tarix. ENV yoxdursa proses açarı işlənir. */
const dailySalt = () => {
  const day = new Date().toISOString().slice(0, 10);
  return `${process.env.JWT_SECRET || "ba-link"}:${day}`;
};

/** Ziyarətçi izini geri çevrilməyən heşə çevir. */
function hashVisitor(ip, ua) {
  return crypto
    .createHash("sha256")
    .update(`${ip || ""}|${ua || ""}|${dailySalt()}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * User-Agent-dən cihaz/brauzer/OS.
 *
 * Kitabxana (ua-parser-js) əlavə edilmədi: bizə cəmi üç sadə göstərici lazımdır
 * və onlar üçün 300 KB-lıq asılılıq saxlamaq artıqdır.
 */
export function parseUA(ua = "") {
  const s = String(ua);
  const has = (re) => re.test(s);

  // Botlar ayrıca işarələnir — reklam hesabatında insan kliklərini şişirtməsin.
  if (has(/bot|crawler|spider|crawling|facebookexternalhit|preview|slurp/i)) {
    return { device: "bot", browser: "bot", os: "—" };
  }

  const device = has(/iPad|Tablet/i) ? "tablet" : has(/Mobi|Android|iPhone/i) ? "mobile" : "desktop";

  // Sıra vacibdir: Edge həm «Chrome», həm «Safari» yazır; Chrome «Safari» yazır.
  const browser = has(/Edg\//i) ? "Edge"
    : has(/OPR\/|Opera/i) ? "Opera"
    : has(/SamsungBrowser/i) ? "Samsung"
    : has(/Firefox\//i) ? "Firefox"
    : has(/Chrome\//i) ? "Chrome"
    : has(/Safari\//i) ? "Safari"
    : "digər";

  const os = has(/Windows/i) ? "Windows"
    : has(/Android/i) ? "Android"
    : has(/iPhone|iPad|iOS/i) ? "iOS"
    : has(/Mac OS X/i) ? "macOS"
    : has(/Linux/i) ? "Linux"
    : "digər";

  return { device, browser, os };
}

/**
 * Referer-dən yalnız domen.
 *
 * Tam URL saxlanılmır: o, istifadəçinin hansı səhifədə olduğunu (bəzən şəxsi
 * profil, axtarış sorğusu) açıqlayır. Bizə isə yalnız mənbə lazımdır.
 */
export function parseSource(referer) {
  if (!referer) return "birbaşa";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    // Instagram/Facebook mobil tətbiqi l.instagram.com kimi ara domen işlədir.
    if (/instagram/.test(host)) return "instagram.com";
    if (/facebook|fb\.me/.test(host)) return "facebook.com";
    if (/t\.co|twitter|x\.com/.test(host)) return "x.com";
    if (/tiktok/.test(host)) return "tiktok.com";
    if (/google/.test(host)) return "google";
    return host || "birbaşa";
  } catch {
    return "birbaşa";
  }
}

/**
 * Kod üzrə linki tap, kliki yaz, hədəfi qaytar.
 *
 * @returns {Promise<{ok:boolean, target?:string, reason?:string}>}
 */
export async function recordClick(code, { ip, ua, referer, lang } = {}) {
  const link = await ShortLink.findOne({ code: String(code || "").toLowerCase() });

  if (!link) return { ok: false, reason: "not-found" };
  if (!link.isUsable()) return { ok: false, reason: "inactive" };

  const { device, browser, os } = parseUA(ua);

  // Klik yazısı və sayğac paralel gedir — ziyarətçini gözlətməmək üçün
  // ikisi də tək bir gediş-gəlişdə tamamlanır.
  await Promise.all([
    LinkClick.create({
      link: link._id,
      visitorHash: hashVisitor(ip, ua),
      device,
      browser,
      os,
      source: parseSource(referer),
      lang: (lang || "").slice(0, 8),
    }),
    ShortLink.updateOne(
      { _id: link._id },
      { $inc: { clicks: 1 }, $set: { lastClickAt: new Date() } },
    ),
  ]);

  return { ok: true, target: link.target };
}
