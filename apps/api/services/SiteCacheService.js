// Config
import { config } from "#config";

/**
 * Admin dəyişikliyindən sonra saytın (Next) keşini təmizlə (audit #37).
 *
 * Next ictimai API cavablarını 60 saniyə keşləyir; bu xidmət
 * `POST <WEB_INTERNAL_URL>/internal/revalidate` çağırır və keş dərhal bitir.
 *
 * DEBOUNCE: toplu idxal və ya sihirbaz bir neçə saniyədə onlarla yazma edir —
 * hər biri üçün ayrıca sorğu getməsin, son yazmadan 1.5 s sonra bir dəfə.
 * Uğursuzluq sorğunu pozmur: keş ən geci 60 s-də öz-özünə yenilənir.
 */
const DEBOUNCE_MS = 1500;
let timer = null;
let warned = false;
// Konfiqurasiya xəbərdarlığının AYRICA bayrağı var: ümumi `warned`-i
// qaldırsaydı, sonradan açar təyin olunanda şəbəkə xətası xəbərdarlığı
// susdurulardı (package5.test.js bunu yoxlayır).
let configWarned = false;

async function send() {
  timer = null;
  // Əvvəl konfiqurasiya yoxdursa SƏSSİZCƏ çıxırdı. Nəticə: kurs deaktiv
  // ediləndə səhifəsi günlərlə açıq qalırdı. «Ən geci 60 s» fərziyyəsi
  // silinmə üçün doğru deyil — Next 404 cavabını keşə yazmır, köhnə 200
  // cavabı isə «stale» kimi verilməyə davam edir. Canlıda otel-turizm,
  // fransiz-dili-kursu və usaq-mentiq məhz belə yetim qaldı.
  if (!config.internalApiKey || !config.webInternalUrl) {
    if (!configWarned) {
      console.warn(
        "⚠️  Sayt keşi təmizlənmir: INTERNAL_API_KEY və ya WEB_INTERNAL_URL təyin olunmayıb. " +
          "Silinən/deaktiv edilən məzmun saytda açıq qalacaq.",
      );
      configWarned = true;
    }
    return;
  }
  try {
    const res = await fetch(`${config.webInternalUrl}/internal/revalidate`, {
      method: "POST",
      headers: { "x-internal-key": config.internalApiKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    warned = false;
  } catch (err) {
    // Hər yazmada logu doldurmasın — bərpa olunana qədər bir dəfə.
    if (!warned) {
      console.warn(`⚠️  Sayt keşi yenilənmədi (${err.message}) — dəyişiklik ən geci 60 s-də görünəcək`);
      warned = true;
    }
  }
}

export function purgeSiteCache() {
  clearTimeout(timer);
  timer = setTimeout(send, DEBOUNCE_MS);
  timer.unref?.();
}

/** Test üçün: gözləyən çağırışı dərhal icra et. */
export function flushSiteCache() {
  if (!timer) return Promise.resolve();
  clearTimeout(timer);
  return send();
}
