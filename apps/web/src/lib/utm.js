/**
 * Qısa linkin (/r/<kod>) saytdaxili hədəfinə UTM əlavə edir.
 *
 * ── NİYƏ ──
 * Əvvəl /r/<kod> hədəfə UTM-siz yönləndirirdi. Nəticədə:
 *   • Google Analytics həmin ziyarəti kampaniyaya bağlaya bilmirdi —
 *     «instagram.com / referral» və ya «(direct)» kimi görünürdü;
 *   • admin paneldəki «Müraciət hunisi» klikdən sonra müraciət olub-olmadığını
 *     göstərə bilmirdi.
 * İndi GA-da: source = <kod>, medium = qisa-link, campaign = <kod>.
 *
 * TOXUNULMUR:
 *   • xarici hədəf (başqa sayt) — onun analitikası bizim işimiz deyil;
 *   • hədəfdə artıq utm_* varsa — marketinq əl ilə yazıb, üstünə yazılmır.
 */

const OWN_HOST = /(^|\.)britishacademy\.az$/i;

export function withUtm(target, code) {
  const t = String(target || "");
  if (!t || !code) return t;
  const relative = t.startsWith("/") && !t.startsWith("//");

  let u;
  try {
    u = new URL(t, "https://britishacademy.az");
  } catch {
    return t;
  }
  if (!relative && !OWN_HOST.test(u.hostname)) return t;
  if ([...u.searchParams.keys()].some((k) => k.toLowerCase().startsWith("utm_"))) return t;

  u.searchParams.set("utm_source", code);
  u.searchParams.set("utm_medium", "qisa-link");
  u.searchParams.set("utm_campaign", code);
  return relative ? `${u.pathname}${u.search}${u.hash}` : u.toString();
}
