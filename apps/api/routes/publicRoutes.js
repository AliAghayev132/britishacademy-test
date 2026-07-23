import { Router } from "#constants";
import {
  publicController,
  leadController,
  seoController,
} from "#controllers";
import { writeRateLimiter } from "#middlewares";

const PublicRouter = Router();

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

export { PublicRouter };
