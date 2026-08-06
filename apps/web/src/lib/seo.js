// ── SEO config + metadata builders ──
// Metadata is admin-driven: global defaults come from SiteSetting (titleTemplate,
// defaultDescription, defaultOgImage, keywords, twitter, verification) and each
// page merges its own `seo` sub-doc on top. Falls back to the constants below if
// the API is unreachable.

import { apiGet } from "@/lib/api";

export const SITE_NAME = "British Academy";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const DEFAULT_TITLE = "British Academy — Dil kursları, IELTS/TOEFL hazırlığı və xaricdə təhsil";
export const DEFAULT_DESCRIPTION = "British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil.";
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
  const seo = s?.seo || {};
  const name = s?.brand?.name || SITE_NAME;
  const titleTemplate = seo.titleTemplate || `%s — ${name}`;
  const defTitle = seo.defaultTitle || DEFAULT_TITLE;
  const desc = description || seo.defaultDescription || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path}`;
  const canon = canonical || url;
  const fullImg = abs(image || seo.defaultOgImage || s?.brand?.ogImage);
  const composed = title ? titleTemplate.replace("%s", title) : defTitle;
  const kw = (keywords && keywords.length ? keywords : seo.keywords) || [];

  return {
    title: { absolute: composed },
    description: desc,
    metadataBase: new URL(SITE_URL),
    keywords: kw.length ? kw : undefined,
    alternates: { canonical: canon },
    openGraph: {
      title: composed, description: desc, url, siteName: name, locale: "az_AZ", type,
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
