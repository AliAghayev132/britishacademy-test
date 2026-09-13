import { SITE_URL } from "@/lib/seo";
import { apiGet } from "@/lib/api";
import { buildPath, LOCALES } from "@/lib/i18n/routes";

// /sitemap.xml — built from the API's URL list so new courses/posts/branches
// appear automatically. Falls back to the static core routes if the API is down.
//
// `path` kanonik AZ formadadır. HƏR DİL AYRICA giriş alır (/elaqe · /en/contact ·
// /ru/kontakty), hamısı eyni hreflang dəstini daşıyır. Əvvəl EN/RU yalnız
// alternativ kimi keçirdi — axtarış motoru onları ayrıca kəşf etmirdi (audit #30).
const langs = (path) => ({
  languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${buildPath(path, l)}`])),
});

/** lastmod — etibarsız/boşdursa YAZILMIR (əvvəl «indi» yazılırdı). */
const safeDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const entries = ({ path, lastmod, priority = 0.6 }) =>
  LOCALES.map((l) => ({
    url: `${SITE_URL}${buildPath(path, l)}`,
    lastModified: safeDate(lastmod),
    changeFrequency: "weekly",
    priority,
    alternates: langs(path),
  }));

const CORE = [
  { path: "/", priority: 1 },
  { path: "/kurslar", priority: 0.8 },
  { path: "/filiallar", priority: 0.7 },
  { path: "/muellimler", priority: 0.7 },
  { path: "/telebelerimiz", priority: 0.6 },
  { path: "/xaricde-tehsil", priority: 0.7 },
  { path: "/layiheler", priority: 0.6 },
  { path: "/bloq", priority: 0.7 },
  { path: "/testler", priority: 0.8 },
  { path: "/haqqimizda", priority: 0.5 },
  { path: "/elaqe", priority: 0.6 },
];

export default async function sitemap() {
  const data = await apiGet("/seo/urls", { revalidate: 3600 });
  const list = Array.isArray(data?.urls) ? data.urls : CORE;

  const seen = new Set();
  return list
    .filter((u) => {
      if (!u?.path || seen.has(u.path)) return false;
      seen.add(u.path);
      return true;
    })
    .flatMap(entries);
}
