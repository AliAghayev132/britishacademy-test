import "../styles/globals.css";

import { Providers } from "./providers";
import {
  SITE_NAME, SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_IMAGE,
  getSiteSettings,
} from "@/lib/seo";
import { toList } from "@/utils/toList";

const abs = (u) => (!u ? `${SITE_URL}${DEFAULT_IMAGE}` : u.startsWith("http") ? u : `${SITE_URL}${u}`);

// Admin-driven site metadata (defaults + verification codes from SiteSetting).
export async function generateMetadata() {
  const s = await getSiteSettings();
  const seo = s?.seo || {};
  const name = s?.brand?.name || SITE_NAME;
  const defTitle = seo.defaultTitle || DEFAULT_TITLE;
  const defDesc = seo.defaultDescription || DEFAULT_DESCRIPTION;
  const ogImg = abs(seo.defaultOgImage || s?.brand?.ogImage);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: defTitle, template: seo.titleTemplate || `%s — ${name}` },
    description: defDesc,
    applicationName: name,
    keywords: toList(seo.keywords).length ? toList(seo.keywords) : undefined,
    icons: { icon: s?.brand?.favicon || "/assets/favicon.png", apple: "/assets/favicon-180.png" },
    openGraph: {
      type: "website", siteName: name, locale: "az_AZ", url: SITE_URL,
      title: defTitle, description: defDesc,
      images: [{ url: ogImg, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image", site: seo.twitterHandle || undefined,
      title: defTitle, description: defDesc, images: [ogImg],
    },
    robots: { index: true, follow: true },
    verification: {
      google: seo.verification?.google || undefined,
      yandex: seo.verification?.yandex || undefined,
      other: seo.verification?.bing ? { "msvalidate.01": seo.verification.bing } : undefined,
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00157A",
};

/** Global Organization + WebSite JSON-LD (admin-driven). */
async function siteJsonLd() {
  const s = await getSiteSettings();
  const name = s?.brand?.name || SITE_NAME;
  const socials = Object.values(s?.socials || {}).filter(Boolean);
  const org = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url: SITE_URL,
    logo: abs(s?.brand?.logo || s?.brand?.shield),
    description: s?.seo?.defaultDescription || DEFAULT_DESCRIPTION,
    ...(s?.contact?.address ? { address: { "@type": "PostalAddress", streetAddress: s.contact.address, addressLocality: "Bakı", addressCountry: "AZ" } } : {}),
    ...(s?.contact?.phone ? { telephone: s.contact.phone } : {}),
    ...(s?.contact?.email ? { email: s.contact.email } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name, url: SITE_URL };
  return [org, website];
}

export default async function RootLayout({ children }) {
  const ld = await siteJsonLd();
  return (
    <html lang="az">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
