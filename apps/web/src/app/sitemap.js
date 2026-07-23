import { SITE_URL } from "@/lib/seo";
import { apiGet } from "@/lib/api";

// /sitemap.xml — built from the API's URL list so new courses/posts/branches
// appear automatically. Falls back to the static core routes if the API is down.
export default async function sitemap() {
  const now = new Date();
  const core = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/kurslar`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/filiallar`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/muellimler`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/telebelerimiz`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/xaricde-tehsil`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/bloq`, lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/elaqe`, lastModified: now, priority: 0.6 },
  ];

  const data = await apiGet("/seo/urls", { revalidate: 3600 });
  if (!data?.urls) return core;

  const seen = new Set();
  return data.urls
    .filter((u) => {
      if (seen.has(u.path)) return false;
      seen.add(u.path);
      return true;
    })
    .map((u) => ({
      url: `${SITE_URL}${u.path}`,
      lastModified: u.lastmod ? new Date(u.lastmod) : now,
      changeFrequency: "weekly",
      priority: u.priority ?? 0.6,
    }));
}
