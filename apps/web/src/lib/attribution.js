/**
 * Reklam mənbəyi (atribusiya) — istifadəçi hansı reklamdan gəlib.
 *
 * Google Ads-dən gələn müraciətin hansı kampaniyaya aid olduğunu admin
 * paneldə görmək üçün açılış ünvanındakı parametrlər (UTM + Google klik
 * kodu) götürülür və müraciət göndəriləndə onunla BİRLİKDƏ serverə gedir.
 *
 * ── QAYDA: SON REKLAM KLİKİ QALİB GƏLİR ──
 *   • ünvanda utm_* və ya gclid varsa → yeni toxunuş, əvvəlkini əvəz edir;
 *   • yalnız kənar referer varsa (Google axtarışı, başqa sayt) → YALNIZ heç
 *     nə saxlanmayıbsa yazılır: əks halda reklamdan gəlib sonra axtarışla
 *     qayıdan istifadəçinin reklamı silinərdi;
 *   • birbaşa / daxili keçid → heç nə dəyişmir.
 *
 * ── RAZILIQ ──
 * Brauzerdə (localStorage) 30 GÜN yalnız istifadəçi RAZILIQ verəndə saxlanılır.
 * Razılıq yoxdursa məlumat yalnız YADDAŞDA qalır: Next səhifələr arası
 * keçidi səhifəni yenidən yükləmədən edir, ona görə reklamdan gəlib bir neçə
 * səhifə gəzib müraciət edən istifadəçi yenə də kampaniyaya bağlanır — sadəcə
 * cihazında heç nə yazılmır. Vərəq bağlananda isə itir.
 *
 * ŞƏXSİ MƏLUMAT YOXDUR: yalnız kampaniya parametrləri, açılış yolu və
 * refererin domen adı.
 */

const ATTR_KEY = "ba-attr";
const CONSENT_KEY = "ba-consent";
export const CONSENT_EVENT = "ba-consent";
/** Google Ads-in defolt klik pəncərəsi ilə eyni. */
export const ATTRIBUTION_TTL = 30 * 24 * 60 * 60 * 1000;

/** URL parametri → saxlanılan sahə. Reklam qrupu üçün standart UTM yoxdur — utm_content. */
const PARAMS = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
  gclid: "gclid",
};

let mem = null; // razılıq olmasa da səhifələr arası keçiddə qalır

const hasWindow = () => typeof window !== "undefined";
const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null; // gizli rejim / bloklanıb
  }
};

/** "granted" | "denied" | null (hələ seçilməyib). Seçimin özünü saxlamaq razılıq tələb etmir. */
export function getConsent() {
  if (!hasWindow()) return null;
  try {
    const v = storage()?.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function readStored(now) {
  try {
    const rec = JSON.parse(storage()?.getItem(ATTR_KEY) || "null");
    if (rec && typeof rec === "object" && now - Number(rec.ts) < ATTRIBUTION_TTL) return rec;
  } catch {
    /* pozulmuş qeyd — yoxmuş kimi */
  }
  return null;
}

function persist(rec) {
  if (!rec || getConsent() !== "granted") return;
  try {
    storage()?.setItem(ATTR_KEY, JSON.stringify(rec));
  } catch {
    /* yaddaş dolu — yaddaşdakı nüsxə işləyir */
  }
}

/** Kənar refererin domeni; saytın özü və ya yararsız dəyər — boş. */
function referrerHostOf(ref, ownHost) {
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    return h && h !== String(ownHost || "").replace(/^www\./, "") ? h : "";
  } catch {
    return "";
  }
}

/**
 * Səhifə tam yükləndikdə çağırılır (SiteTracker). Reklam klikləri həmişə tam
 * yüklənmədir — Google-dan gəlir — ona görə daxili keçidlərdə təkrar lazım deyil.
 */
export function captureAttribution(now = Date.now()) {
  if (!hasWindow()) return null;
  const q = new URLSearchParams(window.location.search);
  const touch = {};
  for (const [field, param] of Object.entries(PARAMS)) {
    const v = q.get(param);
    if (v) touch[field] = v.slice(0, 200);
  }
  const landing = window.location.pathname || "/";
  const referrerHost = referrerHostOf(window.document?.referrer, window.location.hostname);
  const current = mem || (getConsent() === "granted" ? readStored(now) : null);

  let next = current;
  if (Object.keys(touch).length) {
    next = { ...touch, landing, ...(referrerHost ? { referrerHost } : {}), ts: now };
  } else if (!current && referrerHost) {
    next = { referrerHost, landing, ts: now };
  }

  mem = next;
  if (next && next !== current) persist(next);
  return next;
}

/** Müraciətlə göndəriləcək obyekt — yoxdursa `undefined`. */
export function getAttribution(now = Date.now()) {
  if (!hasWindow()) return undefined;
  if (mem && now - Number(mem.ts) < ATTRIBUTION_TTL) return mem;
  if (getConsent() === "granted") {
    const stored = readStored(now);
    if (stored) {
      mem = stored;
      return stored;
    }
  }
  return undefined;
}

/**
 * Razılıq seçimi. Qəbul → yaddaşdakı mənbə brauzerə yazılır; rədd → brauzerdə
 * saxlanılan nə varsa silinir (yaddaşdakı nüsxə bu vərəqin sonuna qədər qalır).
 */
export function setConsent(value) {
  if (!hasWindow() || (value !== "granted" && value !== "denied")) return;
  try {
    storage()?.setItem(CONSENT_KEY, value);
  } catch {
    /* seçim yaddaşa yazılmadı — banner növbəti dəfə yenə soruşacaq */
  }
  if (value === "granted") persist(mem);
  else {
    try {
      storage()?.removeItem(ATTR_KEY);
    } catch {
      /* yoxdur */
    }
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/** Testlər üçün — modul vəziyyətini sıfırla. */
export function __resetAttributionForTests() {
  mem = null;
}
