// Server-side API helper. Used by Server Components (pages/layout) to fetch from
// the Express API during SSR. Client interactivity uses RTK Query (store/api).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Server-only secret (NOT NEXT_PUBLIC_): marks SSR calls as trusted so the
// API's per-IP rate limiter doesn't throttle the whole site through one IP.
const INTERNAL_HEADERS = process.env.INTERNAL_API_KEY
  ? { "x-internal-key": process.env.INTERNAL_API_KEY }
  : {};

/**
 * GET `${API_URL}/api${path}` and return the envelope's `data` (or null).
 * Never throws for the caller — a failed fetch returns null so pages can render
 * a graceful empty state instead of a 500.
 *
 * @param {string} path       e.g. "/home" or "/courses/ielts"
 * @param {object} [opts]
 * @param {number} [opts.revalidate]  ISR window in seconds (default 60)
 */
export async function apiGet(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json", ...INTERNAL_HEADERS },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Like apiGet but returns `{ data, status }` so callers can 404 explicitly.
 *
 * IMPORTANT: a network failure returns status 0 — callers must NOT treat that
 * as "not found". Use `isMissing()` so a transient API outage surfaces as a
 * 500 (retryable) instead of a permanent 404 that would de-index real pages.
 */
export async function apiGetStatus(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json", ...INTERNAL_HEADERS },
    });
    const json = await res.json().catch(() => null);
    return { data: json?.data ?? null, status: res.status };
  } catch {
    return { data: null, status: 0 };
  }
}

/**
 * True only when the API definitively said "this does not exist" (404).
 * Any other failure (network down, 5xx) throws so Next renders the error
 * boundary with a 5xx status rather than a soft 404.
 */
export function isMissing({ data, status }, key) {
  if (status === 404) return true;
  if (status === 200) return !data?.[key];
  throw new Error(`API unavailable (status ${status})`);
}
