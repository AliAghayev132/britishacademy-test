// ── Dil üzrə URL slug-ları ──
//
// Hər statik səhifənin hər dildə ÖZ route-u var:
//   AZ  /elaqe          EN  /en/contact       RU  /ru/kontakty
//   AZ  /kurslar/ielts  EN  /en/courses/ielts RU  /ru/kursy/ielts
//
// Niyə: əvvəl bütün dillərdə eyni AZ slug işlənirdi (/en/elaqe). Bu həm
// istifadəçi üçün oxunmaz idi, həm də SEO-da zəifdir — axtarış motorları
// URL-dəki açar sözü nəzərə alır, ingilis səhifəsində «elaqe» heç nə demir.
//
// KANONİK forma AZ-dır: daxili Next route qovluqları (app/(public)/elaqe)
// dəyişmir. Proxy gələn lokallaşdırılmış path-ı AZ-a çevirib rewrite edir,
// `withLocale` isə əks istiqamətdə işləyir. Beləcə fayl strukturu toxunulmaz
// qalır, tərcümə yalnız sərhəddə baş verir.
//
// YALNIZ BİRİNCİ seqment tərcümə olunur — qalanı DB-dən gələn slug-dur
// (kurs/bloq/müəllim), onlar olduğu kimi keçir.
//
// Edge runtime-da (proxy) da işləyir: təmiz JS, heç bir asılılıq yoxdur.

export const LOCALES = ["az", "en", "ru"];

/** Kanonik AZ seqment → dil üzrə slug. */
export const ROUTE_SLUGS = {
  haqqimizda: { az: "haqqimizda", en: "about", ru: "o-nas" },
  kurslar: { az: "kurslar", en: "courses", ru: "kursy" },
  muellimler: { az: "muellimler", en: "teachers", ru: "prepodavateli" },
  filiallar: { az: "filiallar", en: "branches", ru: "filialy" },
  "xaricde-tehsil": { az: "xaricde-tehsil", en: "study-abroad", ru: "obuchenie-za-rubezhom" },
  telebelerimiz: { az: "telebelerimiz", en: "students", ru: "studenty" },
  bloq: { az: "bloq", en: "blog", ru: "blog" },
  elaqe: { az: "elaqe", en: "contact", ru: "kontakty" },
};

// Əks indeks: istənilən dildəki slug → kanonik AZ seqment.
// Bir dəfə qurulur; «blog» həm EN, həm RU-dur — hər ikisi eyni kanonikə düşür,
// ona görə toqquşma yoxdur.
const CANONICAL = (() => {
  const map = Object.create(null);
  for (const [canon, byLang] of Object.entries(ROUTE_SLUGS)) {
    map[canon] = canon;
    for (const slug of Object.values(byLang)) map[slug] = canon;
  }
  return map;
})();

/** Path-ı seqmentlərə böl (baş/son «/» təsir etmir). */
function split(path) {
  return String(path || "/").split("/").filter(Boolean);
}

/**
 * Kanonik AZ path → verilmiş dildəki public path.
 * Prefiks ƏLAVƏ ETMİR — onu `withLocale` edir.
 *   localizePath("/kurslar/ielts", "en") → "/courses/ielts"
 */
export function localizePath(path, locale = "az") {
  if (typeof path !== "string" || !path.startsWith("/")) return path;
  const [head, ...rest] = split(path);
  if (!head) return "/";
  const canon = CANONICAL[head];
  // Naməlum seqment (404, /uploads, admin) — toxunma.
  const slug = canon ? ROUTE_SLUGS[canon][locale] || canon : head;
  return "/" + [slug, ...rest].join("/");
}

/**
 * İstənilən dildəki public path → kanonik AZ path (daxili Next route).
 *   canonicalPath("/contact")        → "/elaqe"
 *   canonicalPath("/kursy/ielts")    → "/kurslar/ielts"
 */
export function canonicalPath(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return path;
  const [head, ...rest] = split(path);
  if (!head) return "/";
  return "/" + [CANONICAL[head] || head, ...rest].join("/");
}

/** Path-dan dil prefiksini ayır: "/en/contact" → { locale:"en", path:"/contact" } */
export function splitLocale(pathname) {
  const seg = split(pathname)[0];
  if (seg === "en" || seg === "ru") {
    const rest = String(pathname).slice(seg.length + 1);
    return { locale: seg, path: rest || "/", prefixed: true };
  }
  return { locale: "az", path: pathname || "/", prefixed: false };
}

/**
 * Kanonik AZ path → tam public URL yolu (prefiks + tərcümə olunmuş slug).
 *   buildPath("/elaqe", "en") → "/en/contact"
 *   buildPath("/", "ru")      → "/ru"
 */
export function buildPath(canonPath, locale = "az") {
  const localized = localizePath(canonPath, locale);
  if (locale === "az") return localized;
  return localized === "/" ? `/${locale}` : `/${locale}${localized}`;
}

/**
 * Path-ın BİRİNCİ seqmenti hansı dilin slug-udur?
 * Prefikssiz gələn «/contact» kimi URL-ləri düzgün dilə yönləndirmək üçün.
 * «blog» həm EN, həm RU-dur — belə hallarda `prefer` (cookie dili) seçilir.
 * AZ slug-u və ya naməlum seqment üçün null qaytarır.
 */
export function localeOfPath(path, prefer) {
  const head = split(path)[0];
  if (!head) return null;
  const canon = CANONICAL[head];
  if (!canon || head === ROUTE_SLUGS[canon].az) return null;

  const owners = LOCALES.filter((l) => l !== "az" && ROUTE_SLUGS[canon][l] === head);
  if (!owners.length) return null;
  return owners.includes(prefer) ? prefer : owners[0];
}
