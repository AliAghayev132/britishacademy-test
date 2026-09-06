// Constants
import { Router } from "#constants";

// Controllers
import {
  publicController,
  leadController, linkController, quizController,
  seoController, searchController,
} from "#controllers";

// Middlewares
import { writeRateLimiter, localizeResponse } from "#middlewares";

/**
 * PUBLIC API — mounted at /api. No authentication.
 *
 * Everything here is read-only and safe to cache, with ONE exception:
 * POST /api/leads (the enquiry form), which is rate-limited.
 * Anything that mutates content lives in adminRoutes.js instead.
 */
const PublicRouter = Router();

// Bütün public cavabları seçilmiş dilə görə yastılaşdır ({az,en,ru} → mətn).
PublicRouter.use(localizeResponse);

// Site chrome
PublicRouter.get("/site", publicController.getSite);
PublicRouter.get("/menu", publicController.getMenu);
PublicRouter.get("/home", publicController.getHome);

// Courses (slug routes are namespaced so they never collide with list roots)
PublicRouter.get("/categories", publicController.getCategoryTree);
PublicRouter.get("/courses", publicController.listCourses);
PublicRouter.get("/courses/:slug", publicController.getCourseBySlug);

// Branches
PublicRouter.get("/branches", publicController.listBranches);
PublicRouter.get("/branches/:slug", publicController.getBranchBySlug);

// Teachers
PublicRouter.get("/teachers", publicController.listTeachers);
PublicRouter.get("/teachers/:slug", publicController.getTeacherBySlug);

// Testimonials
PublicRouter.get("/testimonials", publicController.listTestimonials);

// Destinations (study abroad + scholarships)
PublicRouter.get("/destinations", publicController.listDestinations);
PublicRouter.get("/destinations/:slug", publicController.getDestinationBySlug);

// Layihələr — xaricdə təhsil ilə eyni quruluş; müraciət layihənin öz
// səhifəsindən edilir.
PublicRouter.get("/projects", publicController.listProjects);
PublicRouter.get("/projects/:slug", publicController.getProjectBySlug);

// Timetable
PublicRouter.get("/schedule", publicController.listSchedule);

// Blog
PublicRouter.get("/blog", publicController.listBlog);
PublicRouter.get("/blog/:slug", publicController.getBlogBySlug);

// Editorial + misc
PublicRouter.get("/pages/:slug", publicController.getPageBySlug);
PublicRouter.get("/partners", publicController.listPartners);
PublicRouter.get("/faqs", publicController.listFaqs);

// SEO helpers
PublicRouter.get("/seo/robots", seoController.getRobots);
PublicRouter.get("/seo/urls", seoController.getUrls);

// Lead capture (public write — rate limited)
PublicRouter.post("/leads", writeRateLimiter, leadController.createLead);

// İzlənilən qısa link — klik qeydiyyatı.
// Yönləndirmə Next tərəfindədir (/r/<kod>), burada yalnız klik yazılır.
// writeRateLimiter TƏTBİQ OLUNMUR: mobil operator və ofis şəbəkələrində
// yüzlərlə real ziyarətçi eyni IP-dən gəlir, limit onları bloklayardı.
// Ümumi apiRateLimiter (dəqiqədə 100) onsuz da tətbiq olunur.
PublicRouter.post("/track/:code", linkController.track);

// Testlər. Düzgün cavablar getQuiz cavabında GETMİR — qiymətləndirmə
// serverdədir (bax quizController).
// Sayt üzrə ümumi axtarış — kurslar, bloq, layihələr, testlər, ölkələr,
// müəllimlər, filiallar və səhifələr bir sorğuda.
PublicRouter.get("/search", searchController.search);

PublicRouter.get("/quizzes", quizController.listQuizzes);
PublicRouter.get("/quizzes/:slug", quizController.getQuiz);
PublicRouter.post("/quizzes/:slug/submit", quizController.submitQuiz);

export { PublicRouter };
