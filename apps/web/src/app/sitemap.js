import { SITE_URL } from "@/lib/seo";
import { apiGet } from "@/lib/api";
import { buildPath } from "@/lib/i18n/routes";

// /sitemap.xml — built from the API's URL list so new courses/posts/branches
// appear automatically. Falls back to the static core routes if the API is down.
// Hər path üçün az/en/ru hreflang alternates.
// `path` kanonik AZ formadadır — hər dil öz slug-ı ilə verilir
// (/elaqe · /en/contact · /ru/kontakty).
const langs = (path) => ({
  languages: {
    az: `${SITE_URL}${buildPath(path, "az")}`,
    en: `${SITE_URL}${buildPath(path, "en")}`,
    ru: `${SITE_URL}${buildPath(path, "ru")}`,
  },
});

export default async function sitemap() {
  const now = new Date();
  // lastmod-u təhlükəsiz Date-ə çevir; boş/qeyri-etibarlı olarsa `now`
  // (əks halda Next `toISOString()`-də "Invalid time value" atır).
  const safeDate = (v) => {
    if (!v) return now;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? now : d;
  };

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
      lastModified: safeDate(u.lastmod),
      changeFrequency: "weekly",
      priority: u.priority ?? 0.6,
      alternates: langs(u.path),
    }));
}
