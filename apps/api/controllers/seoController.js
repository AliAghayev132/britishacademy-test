// SEO data endpoints. The Next.js app owns /robots.txt and /sitemap.xml, but it
// pulls the editable content (admin-managed robots body) and the URL list from
// here so the API stays the single source of truth.

// Models
import {
  SiteSetting,
  Course,
  CourseCategory,
  Branch,
  Teacher,
  Destination,
  BlogPost,
  Quiz,
  Page,
  Project,
  Testimonial,
} from "#models";

// Utils
import { ok, asyncHandler } from "#utils";

/**
 * Səhifə sənədi (Page) → saytdakı marşrut. Page kolleksiyasındakı hər sənədin
 * öz ünvanı YOXDUR — əvvəl hamısı `/<slug>` kimi sitemap-a düşür və 404
 * verirdi. Burada yalnız lastmod üçün oxunur.
 */
const PAGE_ROUTES = { haqqimizda: "/haqqimizda" };

/** Ən son dəyişiklik tarixi (siyahı boşdursa undefined — «indi» YAZILMIR). */
const latest = (...lists) => {
  let max;
  for (const list of lists) {
    for (const i of list) if (i.updatedAt && (!max || i.updatedAt > max)) max = i.updatedAt;
  }
  return max;
};

/** GET /api/seo/robots — raw robots.txt body (admin-editable). */
const getRobots = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.getCached();
  ok(res, { robotsTxt: settings.robotsTxt || "" });
});

/**
 * GET /api/seo/urls — flat list of public URLs + lastmod, for sitemap.xml.
 * Returns paths only; the Next.js sitemap route prefixes the site origin.
 */
const getUrls = asyncHandler(async (_req, res) => {
  const [courses, categories, branches, teachers, destinations, posts, pages, quizzes, projects, testimonials] =
    await Promise.all([
      Course.findPublic().select("slug updatedAt"),
      CourseCategory.findPublic().select("slug updatedAt"),
      Branch.findPublic().select("slug updatedAt"),
      Teacher.findPublic().select("slug updatedAt"),
      Destination.findPublic().select("slug updatedAt"),
      BlogPost.findPublished().select("slug updatedAt"),
      Page.findPublic({ slug: { $in: Object.keys(PAGE_ROUTES) } }).select("slug updatedAt"),
      Quiz.findPublic().select("slug updatedAt"),
      Project.findPublic().select("slug updatedAt"),
      // Yalnız lastmod üçün — rəylərin öz ünvanı yoxdur, hamısı
      // /telebelerimiz səhifəsindədir.
      Testimonial.findPublic().select("updatedAt"),
    ]);

  const map = (items, prefix, priority) =>
    items.map((i) => ({
      path: prefix ? `${prefix}/${i.slug}` : `/${i.slug}`,
      lastmod: i.updatedAt,
      priority,
    }));

  // Siyahı səhifələrinin lastmod-u içindəki ən son dəyişiklikdir. Əvvəl
  // hər dəfə «indi» idi — Google hər gün hamısını dəyişmiş sayıb bu siqnala
  // inanmağı dayandırır (audit #30).
  //
  // /filiallar/<slug> ARTIQ VAR. Bir müddət yox idi (hamısı bir səhifədə
  // idi) və hər filial 404 verən ünvan kimi sitemap-a düşürdü — ona görə
  // çıxarılmışdı. İndi hər filialın öz səhifəsi var: lokal axtarış üçün
  // ünvan, metro, iş saatları və həmin filialda keçilən kurslar.
  const urls = [
    { path: "/", lastmod: latest(courses, posts, destinations), priority: 1.0 },
    { path: "/kurslar", lastmod: latest(courses, categories), priority: 0.8 },
    // Qiymət cədvəli — kurs matrisindən hesablanır, ona görə lastmod kurslarla eynidir.
    { path: "/kurslar/qiymetler", lastmod: latest(courses), priority: 0.8 },
    { path: "/muellimler", lastmod: latest(teachers), priority: 0.7 },
    { path: "/filiallar", lastmod: latest(branches), priority: 0.7 },
    { path: "/telebelerimiz", lastmod: latest(testimonials), priority: 0.6 },
    { path: "/xaricde-tehsil", lastmod: latest(destinations), priority: 0.7 },
    { path: "/layiheler", lastmod: latest(projects), priority: 0.6 },
    { path: "/bloq", lastmod: latest(posts), priority: 0.7 },
    // Əlaqə səhifəsinin məzmunu filiallardır — lastmod da onlardan gəlir.
    { path: "/elaqe", lastmod: latest(branches), priority: 0.6 },
    // Haqqımızda sənədsiz də açılır (statik mətn) — həmişə siyahıdadır.
    { path: "/haqqimizda", lastmod: pages.find((p) => p.slug === "haqqimizda")?.updatedAt, priority: 0.5 },
    // Testlər — köhnə saytda ən çox girilən səhifələr idi, indeksdə qalmalıdır.
    { path: "/testler", lastmod: latest(quizzes), priority: 0.8 },
    ...map(categories, "/kurslar", 0.8),
    ...map(courses, "/kurslar", 0.8),
    ...map(branches, "/filiallar", 0.6),
    ...map(teachers, "/muellimler", 0.6),
    ...map(destinations, "/xaricde-tehsil", 0.6),
    ...map(projects, "/layiheler", 0.5),
    ...map(posts, "/bloq", 0.6),
    ...map(quizzes, "/testler", 0.7),
  ];

  ok(res, { urls });
});

export { getRobots, getUrls };
