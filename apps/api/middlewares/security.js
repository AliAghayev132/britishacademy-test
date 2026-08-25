import { rateLimit } from "#lib";
import { config } from "#config";

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
  skip: (req) =>
    Boolean(config.internalApiKey) &&
    req.headers["x-internal-key"] === config.internalApiKey,
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
  writeRateLimiter,
  securityHeaders,
  noCookies,
};
