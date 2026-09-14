// Lib
import { API_URL } from '@/lib/variables'

/* =====================================================================
 *  Admin sessiyası — HttpOnly cookie-lərdə (audit #2).
 *
 *  Tokenlər brauzer JS-inə görünmür: API girişdə onları HttpOnly cookie
 *  kimi yazır, brauzer hər sorğuya özü qoşur (`credentials: 'include'`).
 *  Klientdə yalnız istifadəçi profili saxlanılır (authSlice).
 *
 *  Access token 15 dəqiqəlikdir. Bitəndə RTK Query, fayl yükləmə və socket
 *  eyni `refreshSession()`-u çağırır.
 * ===================================================================== */

let inflight = null

/**
 * Access tokeni refresh cookie ilə yeniləyir.
 *
 * MUTEX: panel açılanda bir neçə sorğu eyni anda 401 alır. Hər biri ayrıca
 * refresh göndərsəydi, birinin yazdığı yeni cookie o birinin cavabı ilə
 * yarışardı. İndi hamısı eyni sorğunu gözləyir.
 *
 * @returns {Promise<'ok' | 'expired' | 'error'>}
 *   'expired' — sessiya həqiqətən bitib (401/403), yenidən giriş lazımdır;
 *   'error'   — şəbəkə və ya server xətası: istifadəçi ÇIXARILMIR, çünki
 *               bir anlıq əlaqə kəsilməsi hamını paneldən atmamalıdır.
 */
export function refreshSession() {
  if (!inflight) {
    inflight = (async () => {
      try {
        const r = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (r.ok) return 'ok'
        return r.status === 401 || r.status === 403 ? 'expired' : 'error'
      } catch {
        return 'error'
      }
    })().finally(() => {
      inflight = null
    })
  }
  return inflight
}

/**
 * Sessiya bitəndə panel səhifəsindən girişə keçir (qayıdış ünvanı ilə).
 * İctimai səhifələrə toxunulmur — orada giriş tələb olunmur.
 */
export function redirectToLogin() {
  if (typeof window === 'undefined') return
  const { pathname, search } = window.location
  if (!pathname.startsWith('/dashboard')) return
  try {
    window.localStorage.removeItem('auth')
  } catch {
    // Privat rejim.
  }
  // Tam yükləmə qəsdəndir: Redux və RTK Query keşi köhnə sessiyadan təmizlənir.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?from=${encodeURIComponent(pathname + search)}`)
}
