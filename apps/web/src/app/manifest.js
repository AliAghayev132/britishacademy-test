// /manifest.webmanifest — PWA manifest, brand-driven from SiteSetting.
import { getSiteSettings, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";

export const revalidate = 3600;

export default async function manifest() {
  const s = await getSiteSettings();
  const name = s?.brand?.name || SITE_NAME;
  return {
    name,
    short_name: name,
    description: s?.seo?.defaultDescription || DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: s?.brand?.themeColor || "#00157A",
    icons: [
      { src: s?.brand?.favicon || "/assets/favicon.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/favicon-180.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
