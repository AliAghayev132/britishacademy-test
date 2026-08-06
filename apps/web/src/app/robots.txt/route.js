// /robots.txt — served from the admin-editable SiteSetting.robotsTxt when set,
// otherwise a sensible default (allow all, block the dashboard, link sitemap).
import { getSiteSettings, SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const s = await getSiteSettings();
  let body = (s?.robotsTxt || "").trim();
  if (!body) {
    body = `User-agent: *\nAllow: /\nDisallow: /dashboard\n\nSitemap: ${SITE_URL}/sitemap.xml`;
  }
  return new Response(body + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
