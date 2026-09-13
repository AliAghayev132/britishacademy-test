import crypto from "node:crypto";
import net from "node:net";

// Config
import { config } from "#config";

/**
 * Ziyarətçinin həqiqi IP-si (audit #22).
 *
 * Əvvəl `X-Forwarded-For` başlığının İLK dəyəri götürülürdü. Onu ziyarətçi
 * özü yazır — nginx yalnız sonuna həqiqi ünvanı ƏLAVƏ edir. Nəticədə audit
 * logdakı giriş cəhdlərinin IP-si və link statistikasındakı unikal ziyarətçi
 * istənilən dəyərə dəyişdirilə bilirdi.
 *
 * İndi:
 *  - Brauzerdən nginx vasitəsilə gələn sorğu: `req.ip`. app.js-də
 *    `trust proxy = 1` olduğu üçün Express nginx-in əlavə etdiyi SONUNCU
 *    dəyəri götürür — saxtalaşdırıla bilməz.
 *  - Next serverindən gələn sorğu (qısa link /r/<kod>): Next ziyarətçinin
 *    IP-sini `x-client-ip` ilə ötürür. Bu başlığa YALNIZ gizli
 *    `x-internal-key` düzgün olanda inanılır.
 *
 * Cloudflare proxy-si (narıncı bulud) yandırılsa, nginx-də `real_ip_header
 * CF-Connecting-IP` qurulmalıdır — yoxsa hamı Cloudflare IP-si kimi görünər.
 */

const sameSecret = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Sorğu gizli açarla gələn daxili (Next SSR) sorğudurmu? */
const isInternalRequest = (req) =>
  Boolean(config.internalApiKey) &&
  sameSecret(req?.headers?.["x-internal-key"] || "", config.internalApiKey);

const clientIp = (req) => {
  if (isInternalRequest(req)) {
    const forwarded = String(req.headers["x-client-ip"] || "").trim();
    if (net.isIP(forwarded)) return forwarded;
  }
  return req?.ip || undefined;
};

export { isInternalRequest, clientIp };
