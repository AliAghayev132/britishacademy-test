// Models
import { Course, Branch, Teacher } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { live, CARD_EXCLUDE } from "./shared.js";

/**
 * Müəllimin keçdiyi kurslar — əlaqə kursun özündədir (Course.teachers).
 * Siyahı səhifəsi üçün bir sorğu ilə bütün kurslar çəkilir və müəllimlərə
 * paylanır: kurs sayı onlarladır, müəllim başına ayrı sorğu mənasız olardı.
 */
const withCourses = (teachers, courses) =>
  teachers.map((t) => {
    const obj = t.toObject({ virtuals: true });
    obj.courses = courses
      .filter((c) => (c.teachers || []).some((id) => String(id) === String(t._id)))
      .map((c) => ({ _id: c._id, title: c.title, slug: c.slug }));
    return obj;
  });

/* ---------------- Teachers ---------------- */

const listTeachers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch });
    filter.branches = b ? b._id : null; // unknown branch → no results
  }

  // Kurs süzgəci: müəllim kursun `teachers` siyahısındadırsa.
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course, isDeleted: false }).select("teachers");
    filter._id = { $in: c ? c.teachers || [] : [] }; // naməlum kurs → nəticə yoxdur
  }

  const [teachers, courses] = await Promise.all([
    Teacher.findPublic(filter).populate(live("branches", "name slug")),
    Course.findPublic().select("title slug teachers"),
  ]);
  ok(res, { teachers: withCourses(teachers, courses) });
});

const getTeacherBySlug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate(live("branches", "name slug"));
  if (!teacher) {
    return fail(res, "Müəllim tapılmadı", 404);
  }

  // Keçdiyi kurslar — kart kimi göstərilir, ağır sahələr çəkilmir.
  const courses = await Course.findPublic({ teachers: teacher._id })
    .populate(live("category", "name slug"))
    .select(CARD_EXCLUDE);

  ok(res, { teacher, courses });
});

export { listTeachers, getTeacherBySlug };
