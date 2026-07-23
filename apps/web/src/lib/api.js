// Server-side API helper. Used by Server Components (pages/layout) to fetch from
// the Express API during SSR. Client interactivity uses RTK Query (store/api).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/** Like apiGet but returns `{ data, status }` so callers can 404 explicitly. */
export async function apiGetStatus(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    const json = await res.json().catch(() => null);
    return { data: json?.data ?? null, status: res.status };
  } catch {
    return { data: null, status: 0 };
  }
}
