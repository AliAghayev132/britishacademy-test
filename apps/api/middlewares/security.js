// Lib
import { rateLimit, ipKeyGenerator } from "#lib";

// Utils
import { isInternalRequest } from "#utils";

/**
 * Rate limiter for general API requests.
 */
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    message: "Rate limit exceeded",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trusted server-to-server calls (Next.js SSR) come from ONE IP and would
  // otherwise exhaust the per-IP budget for every visitor at once.
  skip: isInternalRequest,
});

/**
 * Stricter limiter for login attempts (brute-force protection).
 *
 * `skipSuccessfulRequests` VACİBDİR: onsuz uğurlu girişlər də kvotanı yeyirdi,
 * yəni ofisdən (bir NAT IP-dən) bir neçə admin növbə ilə girəndə hamı 15 dəqiqə
 * bloklanırdı. İndi yalnız UĞURSUZ cəhdlər sayılır — brute-force qorunması eyni
 * qalır, normal istifadə əziyyət çəkmir.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 10, // IP başına 10 UĞURSUZ cəhd
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Çox sayda uğursuz giriş cəhdi. 15 dəqiqə gözləyin və ya parolu " +
      "serverdə sıfırlayın (node scripts/adminDoctor.js --reset).",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP kodu GÖNDƏRƏN marşrutlar (qeydiyyat, yenidən göndər, şifrə bərpası).
 *
 * Əvvəl limit yox idi: istənilən ünvana limitsiz məktub atmaq və yeni kodla
 * cəhd sayğacını sıfırlamaq mümkün idi. Açar IP + e-poçtdur — ofisdə eyni
 * IP-dən fərqli adamlar bir-birini bloklamasın.
 */
const otpKey = (req) =>
  `${ipKeyGenerator(req.ip || "")}|${String(req.body?.email || "").toLowerCase().slice(0, 120)}`;

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: otpKey,
  message: { success: false, message: "Çox sayda kod sorğusu. 15 dəqiqə sonra yenidən cəhd edin." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** OTP kodu YOXLAYAN marşrutlar — təxmin etməyə qarşı IP üzrə limit. */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Çox sayda yoxlama cəhdi. 15 dəqiqə sonra yenidən cəhd edin." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * İctimai müraciət formu — admin yazmalarından AYRI limit.
 *
 * Əvvəl /api/leads admin panelinin bütün yazmaları ilə eyni hovuzda idi:
 * spam həm müraciət, həm də admin işini bloklaya bilərdi.
 */
const leadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Çox sayda müraciət göndərildi. Bir az sonra yenidən cəhd edin." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generic limiter for write operations (create/update/delete).
 */
const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 writes per window
  message: {
    success: false,
    message: "Çox sayda sorğu. Bir az yavaşlayın.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Şəkil, video və PDF brauzerdə açılır; qalan hər şey endirilir. */
const INLINE_UPLOAD_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "mp4", "webm", "ogv", "ogg", "mov", "pdf"]);

/**
 * /uploads statik faylları üçün başlıqlar (express.static setHeaders).
 *
 * Yüklənən fayllar saytın ÖZ domenindən verilir — admin panel ilə eyni
 * origin. Köhnə yükləmələr arasında HTML/SVG ola bilər, ona görə:
 *   • nosniff — brauzer tipi «təxmin» edib HTML-ə çevirməsin;
 *   • CSP sandbox — fayl birbaşa açılsa belə skript İŞLƏMİR (PDF-dən başqa:
 *     brauzerin PDF görüntüləyicisi sandbox-da açılmır);
 *   • şəkil/video/PDF olmayan hər şey endirmə kimi verilir.
 * <img>/<video> teqləri bu başlıqlardan təsirlənmir.
 */
const setUploadHeaders = (res, filePath) => {
  const ext = String(filePath).split(".").pop().toLowerCase();
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (ext !== "pdf") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    );
  }
  if (!INLINE_UPLOAD_EXT.has(ext)) res.setHeader("Content-Disposition", "attachment");
};

/**
 * Extra hardening headers (Helmet covers most; these are belt-and-braces).
 */
const securityHeaders = (req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.removeHeader("X-Powered-By");
  next();
};

/**
 * Only allow essential/httpOnly cookies to be set (privacy by default).
 */
const noCookies = (req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  res.cookie = function (name, value, options) {
    if (options && (options.essential || options.httpOnly)) {
      return originalCookie(name, value, options);
    }
    return this;
  };
  next();
};

export {
  apiRateLimiter,
  loginRateLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  leadRateLimiter,
  setUploadHeaders,
  writeRateLimiter,
  securityHeaders,
  noCookies,
};
