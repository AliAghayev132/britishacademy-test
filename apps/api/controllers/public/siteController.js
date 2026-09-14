// Models
import {
  SiteSetting,
  MenuItem,
  Course,
  Teacher,
  Testimonial,
  Destination,
  Partner,
  Advantage,
  Faq,
  Project,
} from "#models";

// Utils
import { ok, asyncHandler } from "#utils";

// Local
import { CARD_EXCLUDE, publicSettings } from "./shared.js";

/* ---------------- Site chrome ---------------- */

/** GET /api/site — settings + header/footer menus (one call for the layout). */
const getSite = asyncHandler(async (_req, res) => {
  const [settings, header, footer] = await Promise.all([
    SiteSetting.getCached(),
    MenuItem.tree("header"),
    MenuItem.tree("footer"),
  ]);
  ok(res, { settings: publicSettings(settings), menu: { header, footer } });
});

/** GET /api/menu?location=header */
const getMenu = asyncHandler(async (req, res) => {
  const location = req.query.location || "header";
  const items = await MenuItem.tree(location);
  ok(res, { items });
});

/** GET /api/home — everything the homepage needs, in one payload. */
// Ana səhifədəki «Kurslarımız» swiper-ində göstərilən kurs sayı.
// Admin hansıların vacib olduğunu seçir (isFeatured); seçilən sayı bundan
// AZDIRSA qalanı digər aktiv kurslarla tamamlanır ki, swiper yarımçıq
// qalmasın. Əvvəl yalnız seçilmişlər göstərilirdi — 2 kurs işarələnəndə
// bölmə 2 kartla qalırdı.
const HOME_COURSE_COUNT = 6;

const getHome = asyncHandler(async (_req, res) => {
  // Rəy sorğuları da bu dəstəyə daxildir. Əvvəl onlar ARDICIL icra olunurdu
  // (əvvəl mətn rəyləri gözlənilir, sonra videolar) — ana səhifə üçün 3 gediş
  // demək idi. İndi normal halda hamısı BİR gedişdə paralel gedir.
  const [settings, featuredCourses, partners, advantages, destinations, faqs, featuredText, featuredVideo, featuredTeachers, featuredProjects] =
    await Promise.all([
      SiteSetting.getCached(),
      Course.findFeatured(HOME_COURSE_COUNT).populate("category").select(CARD_EXCLUDE),
      Partner.findPublic(),
      Advantage.findPublic(),
      Destination.findPublic({ isFeatured: true }).limit(8).select(CARD_EXCLUDE),
      Faq.findPublic().limit(8),
      Testimonial.findPublic({ type: "text", isFeatured: true }).limit(6),
      Testimonial.findPublic({ type: "video", isFeatured: true }).limit(8),
      // Ana səhifədəki müəllim lenti. Sıra klientdə qarışdırılır (bax
      // TeacherSwiper) — burada sabit sıra qaytarılır ki, SSR ilə ilk render
      // uyğun gəlsin və hidratasiya uyğunsuzluğu yaranmasın.
      Teacher.findPublic({ isFeatured: true }).limit(12),
      // Ana səhifədəki layihə lenti.
      Project.findPublic({ isFeatured: true }).limit(8).select(CARD_EXCLUDE),
    ]);

  // Seçilmiş kurslar 6-dan azdırsa qalanını sıraya görə digər aktiv
  // kurslarla tamamlayırıq. Onsuz da seçilmişlər ƏVVƏLDƏ qalır — admin-in
  // sırası qorunur, tamamlayıcılar sona əlavə olunur.
  let courses = featuredCourses;
  if (courses.length < HOME_COURSE_COUNT) {
    const fill = await Course.findPublic({
      _id: { $nin: courses.map((c) => c._id) },
    })
      .limit(HOME_COURSE_COUNT - courses.length)
      .populate("category")
      .select(CARD_EXCLUDE);
    courses = [...courses, ...fill];
  }

  // Seçilmiş rəy yoxdursa istənilən dərc olunmuşa düşürük ki, bölmə yalnız
  // admin paneldə heç nə işarələnmədiyinə görə boş qalmasın. Bu ehtiyat
  // sorğular yalnız lazım olanda və yenə PARALEL işləyir.
  let testimonials = featuredText;
  let videoTestimonials = featuredVideo;

  if (!testimonials.length || !videoTestimonials.length) {
    const [fallbackText, fallbackVideo] = await Promise.all([
      testimonials.length ? null : Testimonial.findPublic({ type: "text" }).limit(6),
      videoTestimonials.length ? null : Testimonial.findPublic({ type: "video" }).limit(8),
    ]);
    if (fallbackText) testimonials = fallbackText;
    if (fallbackVideo) videoTestimonials = fallbackVideo;
  }

  ok(res, {
    settings: publicSettings(settings),
    courses, testimonials, videoTestimonials, partners, advantages, destinations, faqs,
    teachers: featuredTeachers,
    projects: featuredProjects,
  });
});

export { getSite, getMenu, getHome };
