// ── SEO config + metadata builders ──
// Metadata is admin-driven: global defaults come from SiteSetting (titleTemplate,
// defaultDescription, defaultOgImage, keywords, twitter, verification) and each
// page merges its own `seo` sub-doc on top. Falls back to the constants below if
// the API is unreachable.

import { apiGet } from "@/lib/api";
import { buildPath } from "./i18n/routes";
import { getLocale } from "./i18n/serverT";
import { toList } from "@/utils/toList";

export const SITE_NAME = "British Academy";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
/**
 * Ehtiyat başlıq və təsvir — DİL ÜZRƏ.
 *
 * Bunlar yalnız admin paneldə «SEO → Defolt başlıq/təsvir» boş qalanda
 * işləyir. Sabit azərbaycanca sətir olduqları müddətdə /en və /ru
 * səhifələrinin <title> və <meta description>-ı azərbaycanca gedirdi — yəni
 * axtarış nəticələrində ingilis və rus dilli istifadəçi AZ mətn görürdü.
 */
const DEFAULTS = {
  az: {
    title: "British Academy — Dil kursları, IELTS/TOEFL hazırlığı və xaricdə təhsil",
    description:
      "British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil.",
  },
  en: {
    title: "British Academy — Language courses, IELTS/TOEFL preparation and study abroad",
    description:
      "British Academy — a language centre accredited by English UK. English, Russian and German courses, IELTS · TOEFL preparation and study abroad.",
  },
  ru: {
    title: "British Academy — Языковые курсы, подготовка к IELTS/TOEFL и обучение за рубежом",
    description:
      "British Academy — языковой центр с аккредитацией English UK. Курсы английского, русского и немецкого, подготовка к IELTS · TOEFL и обучение за рубежом.",
  },
};

/** Dil üzrə ehtiyat dəyərlər (naməlum dil → AZ). */
export const defaultsFor = (locale) => DEFAULTS[locale] || DEFAULTS.az;

export const DEFAULT_TITLE = DEFAULTS.az.title;
export const DEFAULT_DESCRIPTION = DEFAULTS.az.description;
export const DEFAULT_IMAGE = "/assets/og-cover.png";

const abs = (img) => (!img ? `${SITE_URL}${DEFAULT_IMAGE}` : img.startsWith("http") ? img : `${SITE_URL}${img}`);

/** Fetch the SiteSetting singleton (cached) for admin-driven SEO defaults. */
export async function getSiteSettings() {
  try {
    const data = await apiGet("/site", { revalidate: 3600 });
    return data?.settings || null;
  } catch {
    return null;
  }
}

/**
 * Core builder — resolves global (admin) defaults, then applies per-page values.
 * Returns a full Next.js Metadata object. Use from an async generateMetadata.
 */
export async function resolveMetadata({
  title, description, path = "", image, keywords, noindex, canonical, type = "website",
} = {}) {
  const s = await getSiteSettings();
  const locale = await getLocale();
  const seo = s?.seo || {};
  const name = s?.brand?.name || SITE_NAME;
  const titleTemplate = seo.titleTemplate || `%s — ${name}`;
  const def = defaultsFor(locale);
  const defTitle = seo.defaultTitle || def.title;
  const desc = description || seo.defaultDescription || def.description;
  // `path` KANONİK AZ formadadır; public URL cari dilin slug-ı ilə qurulur.
  const url = `${SITE_URL}${buildPath(path || "/", locale)}`;
  const canon = canonical || url;
  const fullImg = abs(image || seo.defaultOgImage || s?.brand?.ogImage);
  const composed = title ? titleTemplate.replace("%s", title) : defTitle;
  // Açar sözlər dil üzrə vergüllə ayrılmış mətn ola bilər (köhnə data massiv).
  const ownKw = toList(keywords);
  const kw = ownKw.length ? ownKw : toList(seo.keywords);

  return {
    title: { absolute: composed },
    description: desc,
    metadataBase: new URL(SITE_URL),
    keywords: kw.length ? kw : undefined,
    alternates: {
      canonical: canon,
      // hreflang — hər dil üçün ayrı URL (az prefikssiz, en/ru prefiksli).
      languages: {
        az: `${SITE_URL}${buildPath(path || "/", "az")}`,
        en: `${SITE_URL}${buildPath(path || "/", "en")}`,
        ru: `${SITE_URL}${buildPath(path || "/", "ru")}`,
        "x-default": `${SITE_URL}${buildPath(path || "/", "az")}`,
      },
    },
    openGraph: {
      title: composed, description: desc, url, siteName: name, locale: { az: "az_AZ", en: "en_US", ru: "ru_RU" }[locale] || "az_AZ", type,
      images: [{ url: fullImg, width: 1200, height: 630, alt: composed }],
    },
    twitter: {
      card: "summary_large_image",
      site: seo.twitterHandle || undefined,
      title: composed, description: desc, images: [fullImg],
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

/** Map an API `seo` sub-doc onto resolveMetadata (falls back to page data). Async. */
export function metaFromApi(seo = {}, fallback = {}) {
  return resolveMetadata({
    title: seo.metaTitle || fallback.title,
    description: seo.metaDescription || fallback.description,
    path: fallback.path,
    image: seo.ogImage || fallback.image,
    keywords: seo.keywords,
    canonical: seo.canonical,
    noindex: seo.noindex,
    type: fallback.type,
  });
}

/** Convenience for pages without an API seo doc (home, static hubs). Async. */
export function buildMetadata(args = {}) {
  return resolveMetadata(args);
}
