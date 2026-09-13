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

async function send() {
  timer = null;
  if (!config.internalApiKey || !config.webInternalUrl) return;
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
