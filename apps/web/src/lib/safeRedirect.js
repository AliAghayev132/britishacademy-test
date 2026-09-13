/**
 * Girişdən sonra hara qayıtmaq — yalnız panelin öz yolları.
 *
 * ── NİYƏ ──
 * `/login?from=https://saxta-panel` əvvəl olduğu kimi `router.push`-a
 * verilirdi: real girişdən dərhal sonra istifadəçi başqa sayta (fişinq)
 * aparılırdı. İndi yalnız `/dashboard`, `/dashboard/...`, `/dashboard?...`
 * qəbul olunur; qalan hər şey defolt ünvana düşür.
 */
export function safeRedirect(from, fallback = "/dashboard") {
  const v = typeof from === "string" ? from : "";
  if (/^\/dashboard(?:[/?#]|$)/.test(v) && !v.includes("\\")) return v;
  return fallback;
}
