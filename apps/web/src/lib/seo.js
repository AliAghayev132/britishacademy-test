// ============ SEO CONFIG ============
export const SITE_NAME = "British Academy";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const DEFAULT_TITLE =
  "British Academy — Dil kursları, IELTS/TOEFL hazırlığı və xaricdə təhsil";
export const DEFAULT_DESCRIPTION =
  "British Academy — English UK akkreditasiyalı dil mərkəzi. İngilis, rus, alman dili kursları, IELTS · TOEFL hazırlığı və xaricdə təhsil.";
export const DEFAULT_IMAGE = "/assets/og-cover.png";

/**
 * Build a Next.js Metadata object for a page. The root layout defines the title
 * template ("%s | British Academy"), so pass a short `title`.
 */
export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  noindex = false,
} = {}) {
  const url = `${SITE_URL}${path}`;
  const fullImage = image?.startsWith("http") ? image : `${SITE_URL}${image}`;
  const composedTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  return {
    title: title ? title : { absolute: DEFAULT_TITLE },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: composedTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "az_AZ",
      images: [{ url: fullImage, width: 1200, height: 630, alt: composedTitle }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: composedTitle,
      description,
      images: [fullImage],
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** Map an API `seo` sub-doc onto buildMetadata args (falls back to page data). */
export function metaFromApi(seo = {}, fallback = {}) {
  return buildMetadata({
    title: seo.metaTitle || fallback.title,
    description: seo.metaDescription || fallback.description,
    path: fallback.path,
    image: seo.ogImage || fallback.image,
    noindex: seo.noindex,
  });
}
