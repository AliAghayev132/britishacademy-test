// Lib
import { ldJson } from "@/lib";
import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_IMAGE,
  defaultsFor,
  getSiteSettings,
  getLocale,
} from "@/lib/server";

// Utils
import { toList } from "@/utils";

// Styles
import "../styles/globals.css";

// Local
import { Providers } from "./providers";

const abs = (u) => (!u ? `${SITE_URL}${DEFAULT_IMAGE}` : u.startsWith("http") ? u : `${SITE_URL}${u}`);

// Admin-driven site metadata (defaults + verification codes from SiteSetting).
export async function generateMetadata() {
  const s = await getSiteSettings();
  const locale = await getLocale();
  const seo = s?.seo || {};
  const name = s?.brand?.name || SITE_NAME;
  const def = defaultsFor(locale);
  const defTitle = seo.defaultTitle || def.title;
  const defDesc = seo.defaultDescription || def.description;
  const ogImg = abs(seo.defaultOgImage || s?.brand?.ogImage);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: defTitle, template: seo.titleTemplate || `%s — ${name}` },
    description: defDesc,
    applicationName: name,
    keywords: toList(seo.keywords).length ? toList(seo.keywords) : undefined,
    icons: { icon: s?.brand?.favicon || "/assets/favicon.png", apple: "/assets/favicon-180.png" },
    openGraph: {
      type: "website", siteName: name, locale: { az: "az_AZ", en: "en_US", ru: "ru_RU" }[locale] || "az_AZ", url: SITE_URL,
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
  const [s, locale] = await Promise.all([getSiteSettings(), getLocale()]);
  const name = s?.brand?.name || SITE_NAME;
  const socials = Object.values(s?.socials || {}).filter(Boolean);
  const org = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url: SITE_URL,
    logo: abs(s?.brand?.logo || s?.brand?.shield),
    description: s?.seo?.defaultDescription || defaultsFor(locale).description,
    ...(s?.contact?.address ? { address: { "@type": "PostalAddress", streetAddress: s.contact.address, addressLocality: { az: "Bakı", en: "Baku", ru: "Баку" }[locale] || "Bakı", addressCountry: "AZ" } } : {}),
    ...(s?.contact?.phone ? { telephone: s.contact.phone } : {}),
    ...(s?.contact?.email ? { email: s.contact.email } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
  const website = { "@context": "https://schema.org", "@type": "WebSite", name, url: SITE_URL };
  return [org, website];
}

export default async function RootLayout({ children }) {
  const [ld, locale] = await Promise.all([siteJsonLd(), getLocale()]);
  return (
    // `lang` seçilmiş dilə görə — əvvəl sabit "az" idi, EN/RU səhifələrdə
    // ekran oxuyucular və axtarış sistemləri səhv dil görürdü.
    <html lang={locale || "az"}>
      <head>
        {/* Şriftlər YERLİDİR (public/fonts + styles/fonts.css) — əvvəl hər
            ziyarətçi üçün Google-a 40-a yaxın sorğu gedirdi. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      </head>
      <body>
        {/* GTM və admin kod inyeksiyası BURADA DEYİL — (public)/layout.js-də.
            Kök layout admin paneli və girişi də əhatə edir; orada ixtiyari
            skript admin tokenini (localStorage) oxuya bilərdi. */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
