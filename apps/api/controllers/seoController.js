// SEO data endpoints. The Next.js app owns /robots.txt and /sitemap.xml, but it
// pulls the editable content (admin-managed robots body) and the URL list from
// here so the API stays the single source of truth.
import { asyncHandler } from "#utils";
import {
  SiteSetting,
  Course,
  CourseCategory,
  Branch,
  Teacher,
  Destination,
  BlogPost,
  Page,
} from "#models";

/** GET /api/seo/robots — raw robots.txt body (admin-editable). */
const getRobots = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.get();
  res.json({ success: true, data: { robotsTxt: settings.robotsTxt || "" } });
});

/**
 * GET /api/seo/urls — flat list of public URLs + lastmod, for sitemap.xml.
 * Returns paths only; the Next.js sitemap route prefixes the site origin.
 */
const getUrls = asyncHandler(async (_req, res) => {
  const [courses, categories, branches, teachers, destinations, posts, pages] =
    await Promise.all([
      Course.findPublic().select("slug updatedAt"),
      CourseCategory.findPublic().select("slug updatedAt"),
      Branch.findPublic().select("slug updatedAt"),
      Teacher.findPublic().select("slug updatedAt"),
      Destination.findPublic().select("slug updatedAt"),
      BlogPost.findPublished().select("slug updatedAt"),
      Page.findPublic().select("slug updatedAt"),
    ]);

  const map = (items, prefix, priority) =>
    items.map((i) => ({
      path: prefix ? `${prefix}/${i.slug}` : `/${i.slug}`,
      lastmod: i.updatedAt,
      priority,
    }));

  const urls = [
    { path: "/", lastmod: new Date(), priority: 1.0 },
    { path: "/kurslar", priority: 0.8 },
    { path: "/muellimler", priority: 0.7 },
    { path: "/filiallar", priority: 0.7 },
    { path: "/telebelerimiz", priority: 0.6 },
    { path: "/xaricde-tehsil", priority: 0.7 },
    { path: "/bloq", priority: 0.7 },
    { path: "/elaqe", priority: 0.6 },
    ...map(categories, "/kurslar", 0.8),
    ...map(courses, "/kurslar", 0.8),
    ...map(branches, "/filiallar", 0.6),
    ...map(teachers, "/muellimler", 0.6),
    ...map(destinations, "/xaricde-tehsil", 0.6),
    ...map(posts, "/bloq", 0.6),
    ...map(pages, "", 0.5),
  ];

  res.json({ success: true, data: { urls } });
});

export { getRobots, getUrls };
