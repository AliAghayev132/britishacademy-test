// Models
import { Course, CourseCategory } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Data
import { LEGACY_SLUG_OF } from "#data";

// Local
import { live, dropDangling, CARD_EXCLUDE } from "./shared.js";

/* ---------------- Courses ---------------- */

/** GET /api/categories — the mega-menu tree. */
const getCategoryTree = asyncHandler(async (_req, res) => {
  const tree = await CourseCategory.findTree();
  ok(res, { categories: tree });
});

/** GET /api/courses?category=<slug> */
const listCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) {
    const cat = await CourseCategory.findOne({ slug: req.query.category, isDeleted: false });
    // Naməlum kateqoriya BÜTÜN kursları qaytarırdı (audit #40).
    if (!cat) return ok(res, { courses: [] });
    filter.category = cat._id;
  }
  const courses = await Course.findPublic(filter).populate("category").select(CARD_EXCLUDE);
  ok(res, { courses });
});

/**
 * GET /api/courses/:slug — full course page.
 * Populates category, the price matrix's branches and kursu keçən müəllimləri
 * (əvvəl müəllimlər dərs qrafikindən törəyirdi).
 */
const findCourse = (slug) =>
  Course.findOne({ slug, isActive: true, isDeleted: false })
    .populate("category")
    .populate(live("pricing.branch"))
    .populate(live("teachers", "fullName slug title photo color"));

const getCourseBySlug = asyncHandler(async (req, res) => {
  let course = await findCourse(req.params.slug);

  // Slug dəyişdirilib, amma baza miqrasiyası hələ işlədilməyibsə yeni slug
  // bazada olmur. Yönləndirmə isə artıq yeni slug-a işarə edir — nəticədə
  // 301 → 404 zənciri yaranırdı. Ehtiyat olaraq köhnə slug ilə axtarırıq.
  if (!course && LEGACY_SLUG_OF[req.params.slug]) {
    course = await findCourse(LEGACY_SLUG_OF[req.params.slug]);
  }

  if (!course) {
    return fail(res, "Kurs tapılmadı", 404);
  }
  // Baxış sayğacı burada DEYİL — bu GET keşlənir. Brauzerdən sayılır:
  // POST /api/views (eventController.view).

  // Əlaqəli kurslar yalnız kart kimi göstərilir — ağır sahələr çəkilmir.
  const related = await Course.findPublic({
    category: course.category?._id,
    _id: { $ne: course._id },
  })
    .limit(6)
    .select(CARD_EXCLUDE);

  ok(res, {
    course: dropDangling(course, "pricing", "branch"),
    related,
  });
});

export { getCategoryTree, listCourses, getCourseBySlug };
