import { SITE_URL } from "@/lib/seo";
import { apiGet } from "@/lib/api";

// /sitemap.xml — built from the API's URL list so new courses/posts/branches
// appear automatically. Falls back to the static core routes if the API is down.
// Hər path üçün az/en/ru hreflang alternates.
const langs = (path) => ({
  languages: {
    az: `${SITE_URL}${path}`,
    en: `${SITE_URL}/en${path}`,
    ru: `${SITE_URL}/ru${path}`,
  },
});

export default async function sitemap() {
  const now = new Date();
  const corePaths = [
    { path: "/", priority: 1 },
    { path: "/kurslar", priority: 0.8 },
    { path: "/filiallar", priority: 0.7 },
    { path: "/muellimler", priority: 0.7 },
    { path: "/telebelerimiz", priority: 0.6 },
    { path: "/xaricde-tehsil", priority: 0.7 },
    { path: "/bloq", priority: 0.7 },
    { path: "/elaqe", priority: 0.6 },
  ];
  const core = corePaths.map((c) => ({
    url: `${SITE_URL}${c.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: c.priority,
    alternates: langs(c.path),
  }));

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
      alternates: langs(u.path),
    }));
}
