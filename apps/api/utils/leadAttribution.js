/**
 * Müraciətin reklam mənbəyi (atribusiya).
 *
 * Sayt istifadəçinin hansı reklamdan gəldiyini (UTM + Google klik kodu)
 * yadda saxlayır və müraciət göndəriləndə onu `attribution` kimi bərabər
 * ötürür. Burada həmin obyekt TƏMİZLƏNİR (açıq endpointdir — gələnə etibar
 * etmirik) və kanala (Google Ads, organik, birbaşa …) ayrılır.
 *
 * ── GOOGLE ADS TƏRƏFİNDƏ AYAR TƏLƏB OLUNUR ──
 * Google Ads UTM-i ÖZÜ ƏLAVƏ ETMİR — avtomatik yalnız `gclid` qoyur. Kampaniya,
 * açar söz və reklam qrupu yalnız hesabda «Final URL suffix» yazılanda gəlir:
 *   utm_source=google&utm_medium=cpc&utm_campaign={campaignid}
 *   &utm_term={keyword}&utm_content={adgroupid}
 * Reklam qrupu üçün standart UTM yoxdur — `utm_content` işlədilir.
 */

/** Kanallar — admin paneldə «Reklam mənbəyi» sütunu və süzgəci. */
export const ATTRIBUTION_CHANNELS = [
  "google-ads",
  "meta-ads",
  "paid-other",
  "organic",
  "social",
  "referral",
  "email",
  "short-link",
  "campaign",
  "direct",
];

const LIMITS = {
  source: 80,
  medium: 80,
  campaign: 150,
  term: 150,
  content: 150,
  gclid: 200,
  landing: 300,
  referrerHost: 120,
};

/** Mətn sahəsi: sətir, idarə simvolları atılır, uzunluq məhdudlaşdırılır. */
function clean(v, max) {
  if (v === null || v === undefined) return undefined;
  const s = String(v)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
  return s || undefined;
}

const SEARCH_RE = /(^|\.)(google|bing|yandex|yahoo|duckduckgo|baidu|ecosia)\./i;
const SOCIAL_RE =
  /(^|\.)(facebook|instagram|fb|t|twitter|x|linkedin|lnkd|tiktok|youtube|telegram|whatsapp|vk|ok)\.(com|me|co|ru|org|in)$/i;
const PAID_MEDIUM_RE = /^(cpc|ppc|cpm|paid|paid[-_ ]?search|paid[-_ ]?social|display|banner)$/i;
const META_RE = /facebook|instagram|meta|\bfb\b|\big\b/i;

/**
 * Kanal — müraciətin hansı növ trafikdən gəldiyi.
 *
 * Üstünlük: Google klik kodu → ödənişli medium → e-poçt / qısa link → hər hansı
 * UTM → referer (axtarış / sosial / başqa sayt) → birbaşa.
 */
export function classifyChannel(a = {}) {
  const source = String(a.source || "").toLowerCase();
  const medium = String(a.medium || "").toLowerCase();

  // `gclid` Google Ads klikinin özüdür — UTM ayarlanmasa belə qəti əlamətdir.
  if (a.gclid) return "google-ads";
  if (PAID_MEDIUM_RE.test(medium)) {
    if (/google|adwords/.test(source)) return "google-ads";
    if (META_RE.test(source)) return "meta-ads";
    return "paid-other";
  }
  if (medium === "email" || medium === "e-mail") return "email";
  // Saytın öz qısa linkləri (/r/<kod>) bu medium-u qoyur — bax lib/utm.js.
  if (medium === "qisa-link") return "short-link";
  if (source) return "campaign";

  const ref = String(a.referrerHost || "").toLowerCase();
  if (ref) {
    if (SEARCH_RE.test(ref)) return "organic";
    if (SOCIAL_RE.test(ref)) return "social";
    return "referral";
  }
  return "direct";
}

/**
 * Saytdan gələn atribusiya obyektini təmizlə. Yararsız və ya boşdursa
 * `undefined` — müraciət reklam məlumatısız yazılır (məs. razılıq verilməyib
 * və istifadəçi başqa vərəqdə qayıdıb).
 */
export function sanitizeAttribution(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const a = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const v = clean(raw[key], max);
    if (v) a[key] = v;
  }
  // Açılış səhifəsi yalnız saytdaxili yoldur — tam URL və ya «javascript:»
  // kimi dəyər qəbul edilmir.
  if (a.landing && !a.landing.startsWith("/")) delete a.landing;
  if (a.referrerHost && !/^[a-z0-9.-]+$/i.test(a.referrerHost)) delete a.referrerHost;

  if (!Object.keys(a).length) return undefined;

  const ts = Number(raw.ts);
  // Gələcək tarix və ya 1 ildən köhnə qeyd mənasızdır — saytın yaddaşı 30 gündür.
  if (Number.isFinite(ts) && ts > 0 && ts <= Date.now() + 60_000 && Date.now() - ts < 365 * 864e5) {
    a.capturedAt = new Date(ts);
  }

  a.channel = classifyChannel(a);
  return a;
}
