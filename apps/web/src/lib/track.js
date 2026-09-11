/**
 * Konversiyanın izlənməsi (ziyarət → forma → müraciət) — iki yerə eyni anda:
 *
 *   1) SAYTIN ÖZ BAZASI (/api/events) — admin paneldə «Statistika →
 *      Konversiya» tabı. Google-dan asılı deyil, reklam bloklayıcısı
 *      GTM-i kəsəndə də işləyir.
 *   2) GOOGLE TAG MANAGER (dataLayer) — GA4 / Google Ads üçün:
 *        apply_modal_open   — forma açıldı
 *        generate_lead      — müraciət göndərildi (GA4-ün tövsiyə etdiyi ad)
 *        virtual_pageview   — «<səhifə>/thank-you» virtual səhifəsi, məs.
 *                             /kurslar/ingilis-dili-kurslari/thank-you
 *      Virtual səhifədir: ziyarətçi başqa ünvana keçmir (modal açıq qalır),
 *      yenilənəndə 404 olmur, amma GA-da həmin URL kimi görünür.
 *
 * ŞƏXSİ MƏLUMAT GÖNDƏRİLMİR: ad, telefon, e-poçt heç birinə getmir.
 * `sid` — təsadüfi anonim sessiya kodu; 30 dəq fəaliyyətsizlikdən sonra
 * yenilənir (GA-dakı sessiya tərifi ilə eyni).
 */

const RAW = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const ENDPOINT = `${RAW ? `${RAW}/api` : "/api"}/events`;
const SID_KEY = "ba-sid";
const VISIT_KEY = "ba-visit";
const SESSION_TTL = 30 * 60 * 1000;

let memSid = null; // localStorage bağlıdırsa (gizli rejim) — səhifə ömrü boyu

const hasWindow = () => typeof window !== "undefined";
const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
const newId = () => {
  const a = new Uint8Array(12);
  window.crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Anonim sessiya kodu. Hər çağırış fəaliyyət sayılır və müddəti uzadır. */
export function getSid(now = Date.now()) {
  if (!hasWindow()) return "";
  const s = storage();
  let rec = null;
  try {
    rec = JSON.parse(s?.getItem(SID_KEY) || "null");
  } catch {
    rec = null;
  }
  let id = rec && /^[a-f0-9]{24}$/.test(rec.id) && now - rec.t < SESSION_TTL ? rec.id : null;
  if (!id) id = s ? newId() : memSid || newId();
  memSid = id;
  try {
    s?.setItem(SID_KEY, JSON.stringify({ id, t: now }));
  } catch {
    /* yaddaş dolu/bağlı — memSid işləyir */
  }
  return id;
}

/** GTM-ə hadisə. GTM yüklənməyibsə də növbədə qalır — yüklənəndə oxunur. */
export function pushDataLayer(data) {
  if (!hasWindow()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

function send(payload) {
  try {
    window
      .fetch(ENDPOINT, {
        method: "POST",
        keepalive: true, // səhifə bağlansa da sorğu çatsın
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      .catch(() => {});
  } catch {
    /* izləmə heç vaxt saytı sındırmamalıdır */
  }
}

const currentPath = () => window.location.pathname.replace(/\/+$/, "") || "/";

/** «Təşəkkür» virtual səhifəsinin yolu: /kurslar/x → /kurslar/x/thank-you. */
export const thankYouPath = (path) => `${path === "/" ? "" : path}/thank-you`;

/** Sayta giriş — sessiyada bir dəfə. */
export function trackVisit() {
  if (!hasWindow()) return;
  const sid = getSid();
  const s = storage();
  try {
    if (s?.getItem(VISIT_KEY) === sid) return;
    s?.setItem(VISIT_KEY, sid);
  } catch {
    /* server onsuz da sessiyada bir ziyarət yazır */
  }
  const q = new URLSearchParams(window.location.search);
  send({
    type: "visit",
    sid,
    path: currentPath(),
    referrer: window.document?.referrer || "",
    utm: {
      source: q.get("utm_source") || undefined,
      medium: q.get("utm_medium") || undefined,
      campaign: q.get("utm_campaign") || undefined,
      gclid: q.has("gclid") || undefined,
      fbclid: q.has("fbclid") || undefined,
    },
  });
}

/** Müraciət formu açıldı. */
export function trackModalOpen({ interest } = {}) {
  if (!hasWindow()) return;
  const path = currentPath();
  send({ type: "modal_open", sid: getSid(), path });
  pushDataLayer({ event: "apply_modal_open", page_path: path, interest: interest || undefined });
}

/**
 * Müraciət uğurla göndərildi. Sayt bazasına burada YAZILMIR — server onu
 * müraciət yarananda özü yazır (bax leadController). Burada yalnız GTM.
 */
export function trackLeadSuccess({ interest, form = "apply-modal" } = {}) {
  if (!hasWindow()) return;
  const path = currentPath();
  const ty = thankYouPath(path);
  pushDataLayer({ event: "generate_lead", form, interest: interest || undefined, page_path: path });
  pushDataLayer({
    event: "virtual_pageview",
    page_path: ty,
    page_location: `${window.location.origin}${ty}`,
    page_title: "Thank you — British Academy",
  });
}
