// Config
import { config } from "#config";

/**
 * Admin sessiyası HttpOnly cookie-lərdə saxlanılır (audit #2).
 *
 * Əvvəl access və refresh tokenləri cavabın gövdəsində qaytarılır, brauzer
 * isə onları localStorage-a və JS-in oxuya bildiyi `token` cookie-sinə
 * yazırdı. Saytdakı istənilən XSS (məsələn, admin kod yeridilməsi və ya
 * zərərli paket) tokenləri oğurlayıb sessiyanı başqa yerdən davam etdirə
 * bilərdi. İndi tokenlər JS-ə heç görünmür:
 *
 *   __starter_at  access token   path=/          15 dəq
 *   __starter_rt  refresh token  path=/api/auth  7 / 30 gün — yalnız auth
 *                                                marşrutlarına gedir
 *   __starter_s   "1" (tokensiz) path=/          refresh ilə eyni ömür —
 *                                                Next proxy-si /dashboard
 *                                                qapısı üçün buna baxır
 *
 * CSRF: cookie-lər SameSite-dır (production-da access/refresh `strict`),
 * yəni başqa saytdan gələn sorğuya qoşulmur; CORS da ağ siyahıdadır.
 *
 * Authorization başlığı hələ də qəbul olunur — skriptlər və testlər üçün.
 */

const REFRESH_PATH = "/api/auth";

/** Cookie başlığından bir dəyəri oxuyur. `source` — req və ya xam başlıq. */
const readCookie = (source, name) => {
  const header = typeof source === "string" ? source : source?.headers?.cookie;
  if (!header) return null;
  // Eyni ad fərqli path-lərdə ola bilər; brauzer daha uzun path-i əvvəl
  // göndərir, ona görə İLK uyğunluq götürülür.
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw) || null;
    } catch {
      return raw || null;
    }
  }
  return null;
};

/** `Authorization: Bearer …` başlığındakı token. */
const bearerToken = (req) => {
  const h = req.header?.("Authorization") || req.headers?.authorization;
  return h && h.startsWith("Bearer ") ? h.slice(7) : null;
};

const accessTokenOf = (req) => bearerToken(req) || readCookie(req, config.accessCookieName);
const refreshTokenOf = (req) => bearerToken(req) || readCookie(req, config.refreshCookieName);

/**
 * `secure` sorğudan götürülür: nginx arxasında (trust proxy + X-Forwarded-Proto)
 * HTTPS-də Secure olur. Sabit `isProduction` olsaydı, sayt müvəqqəti HTTP ilə
 * açılanda brauzer cookie-ni rədd edər və giriş səssizcə sınardı.
 */
const baseOptions = (req, pathName = "/") => ({
  httpOnly: true,
  secure: Boolean(req?.secure),
  sameSite: config.cookie.sameSite,
  domain: config.cookie.domain,
  path: pathName,
});

const setAuthCookies = (req, res, tokens, refreshMaxAge) => {
  res.cookie(config.accessCookieName, tokens.accessToken, {
    ...baseOptions(req),
    maxAge: config.accessTokenMaxAge,
  });
  res.cookie(config.refreshCookieName, tokens.refreshToken, {
    ...baseOptions(req, REFRESH_PATH),
    maxAge: refreshMaxAge,
  });
  // Köhnə versiya refresh cookie-sini path=/ ilə yazırdı — o, hər sorğuya
  // gedirdi. Qalıbsa silinir.
  res.clearCookie(config.refreshCookieName, baseOptions(req));
  // Proxy qapısı üçün göstərici. `lax`: e-poçtdakı /dashboard linkindən
  // gələndə də görünsün (strict olsaydı giriş etmiş admin /login-ə düşərdi).
  res.cookie(config.sessionCookieName, "1", {
    ...baseOptions(req),
    sameSite: "lax",
    maxAge: refreshMaxAge,
  });
};

const clearAuthCookies = (req, res) => {
  res.clearCookie(config.accessCookieName, baseOptions(req));
  res.clearCookie(config.refreshCookieName, baseOptions(req, REFRESH_PATH));
  res.clearCookie(config.refreshCookieName, baseOptions(req));
  res.clearCookie(config.sessionCookieName, { ...baseOptions(req), sameSite: "lax" });
};

export {
  REFRESH_PATH,
  readCookie,
  bearerToken,
  accessTokenOf,
  refreshTokenOf,
  setAuthCookies,
  clearAuthCookies,
};
