// /manifest.webmanifest — PWA manifest, brand-driven from SiteSetting.
import { getSiteSettings, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";

export const revalidate = 3600;

export default async function manifest() {
  const s = await getSiteSettings();
  const name = s?.brand?.name || SITE_NAME;
  const custom = s?.brand?.favicon;
  const customIsSvg = typeof custom === "string" && /\.svg(\?|$)/i.test(custom);
  return {
    name,
    short_name: name,
    description: s?.seo?.defaultDescription || DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: s?.brand?.themeColor || "#00157A",
    // Ölçülər FAKTİKİ fayl ölçüləri olmalıdır. Əvvəl 192x192 və 512x512
    // yazılmışdı, halbuki fayllar 76x76 və 180x180-dir — brauzer
    // «Resource size is not correct» xəbərdarlığı verib ikonu atırdı.
    icons: [
      // Admin paneldən yüklənən favicon YALNIZ SVG-dirsə əlavə olunur.
      // `sizes: "any"` yalnız vektor üçün keçərlidir — PNG-yə «any» yazanda
      // Chrome «Resource size is not correct» deyib ikonu atırdı (canlıda
      // brand.favicon elə /assets/favicon.png idi, yəni həm də təkrar idi).
      // PNG favicon onsuz da <link rel="icon"> ilə işlədilir (layout.js).
      ...(customIsSvg ? [{ src: custom, sizes: "any", type: "image/svg+xml" }] : []),
      { src: "/assets/favicon.png", sizes: "76x76", type: "image/png" },
      { src: "/assets/favicon-180.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
