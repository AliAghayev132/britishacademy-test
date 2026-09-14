// Models
import { Course, CourseCategory, CourseGroup, Branch } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Data
import { LEGACY_SLUG_OF } from "#data";

// Local
import { LIVE, live, dropDangling, CARD_EXCLUDE } from "./shared.js";

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
 * Populates category + the price matrix's branches, and derives the
 * "who teaches here" chips per branch from the schedule (CourseGroup).
 */
const findCourse = (slug) =>
  Course.findOne({ slug, isActive: true, isDeleted: false })
    .populate("category")
    .populate(live("pricing.branch"));

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

  // Qruplar və əlaqəli kurslar bir-birini gözləmir (audit #51). Əlaqəli
  // kurslar yalnız kart kimi göstərilir — ağır sahələr çəkilmir.
  const [groups, related] = await Promise.all([
    CourseGroup.find({
      course: course._id,
      isActive: true,
      isDeleted: false,
    })
      .populate(live("teacher", "fullName slug title photo color"))
      .populate(live("branch", "name slug")),
    Course.findPublic({
      category: course.category?._id,
      _id: { $ne: course._id },
    })
      .limit(6)
      .select(CARD_EXCLUDE),
  ]);

  const teachersByBranch = {};
  for (const g of groups) {
    if (!g.branch || !g.teacher) continue;
    const key = String(g.branch._id);
    (teachersByBranch[key] ||= { branch: g.branch, teachers: [] });
    if (!teachersByBranch[key].teachers.some((t) => String(t._id) === String(g.teacher._id))) {
      teachersByBranch[key].teachers.push(g.teacher);
    }
  }

  ok(res, {
    course: dropDangling(course, "pricing", "branch"),
    teachersByBranch: Object.values(teachersByBranch),
    related,
  });
});

/* ---------------- Schedule (timetable) ---------------- */

/** GET /api/schedule?course=<slug>&branch=<slug> */
const listSchedule = asyncHandler(async (req, res) => {
  const filter = { isActive: true, isDeleted: false };
  // Naməlum kurs/filial süzgəci bütün cədvəli qaytarırdı (audit #40).
  const none = () => ok(res, { groups: [] });
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course, ...LIVE });
    if (!c) return none();
    filter.course = c._id;
  }
  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch, ...LIVE });
    if (!b) return none();
    filter.branch = b._id;
  }
  const groups = await CourseGroup.find(filter)
    .sort({ startDate: 1 })
    .populate(live("course", "title slug"))
    .populate(live("branch", "name slug"))
    .populate(live("teacher", "fullName slug title photo color"));
  ok(res, { groups: groups.filter((g) => g.course && g.branch) });
});

export { getCategoryTree, listCourses, getCourseBySlug, listSchedule };
