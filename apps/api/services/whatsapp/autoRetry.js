// Local
import { AUTO_RETRY_BASE, AUTO_RETRY_MAX } from "./constants.js";
import { isChromeMissing } from "./chrome.js";

// Avtomatik bərpanın geri çəkilməsi (audit #38). Əvvəl Chrome tapılmayanda
// sağlamlıq taymeri hər 60 s yenidən cəhd edib 3 jurnal sətri yazırdı —
// gündə ~4300 qeyd, həqiqi hadisələr itirdi. Vəziyyət servis sinfində
// saxlanılır (_autoFailures, _nextAutoAt, _autoBlocked).

/** Geri çəkilməni sıfırla (əl ilə qoşulma və ya uğurlu `ready`). */
export function resetAutoRetry(svc) {
  svc._autoFailures = 0;
  svc._nextAutoAt = 0;
  svc._autoBlocked = null;
}

/** Avtomatik cəhd indi edilə bilərmi (geri çəkilmə / daimi xəta)? */
export function autoAllowed(svc) {
  return !svc._autoBlocked && Date.now() >= svc._nextAutoAt;
}

/** Uğursuz avtomatik cəhdi qeyd et; jurnal üçün izah qeydini qaytarır. */
export function registerAutoFailure(svc, message) {
  svc._autoFailures += 1;
  if (isChromeMissing(message)) {
    // Chrome özü-özünə yaranmır — dəqiqədə bir yoxlamaq mənasızdır.
    svc._autoBlocked = "chrome";
    return " Avtomatik cəhdlər dayandırıldı — Chrome quraşdırıldıqdan sonra paneldən «Qoşul» basın.";
  }
  const wait = Math.min(AUTO_RETRY_BASE * 2 ** (svc._autoFailures - 1), AUTO_RETRY_MAX);
  svc._nextAutoAt = Date.now() + wait;
  return ` Növbəti avtomatik cəhd ${Math.round(wait / 60_000)} dəq sonra.`;
}
