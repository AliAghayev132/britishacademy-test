// Models
import { Course, CourseGroup, Branch, Teacher } from "#models";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { live, dropDangling } from "./shared.js";

/* ---------------- Teachers ---------------- */

const listTeachers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.branch) {
    const b = await Branch.findOne({ slug: req.query.branch });
    filter.branches = b ? b._id : null; // unknown branch → no results
  }

  // Filter by course via the timetable: teachers who run a group of that course.
  if (req.query.course) {
    const c = await Course.findOne({ slug: req.query.course });
    const ids = c
      ? await CourseGroup.find({
          course: c._id,
          isActive: true,
          isDeleted: false,
        }).distinct("teacher")
      : [];
    filter._id = { $in: ids };
  }

  // assignments.branch — kartda filial adlarını göstərmək və axtarışda
  // kurs/filial adlarına görə tapmaq üçün.
  const teachers = await Teacher.findPublic(filter)
    .populate(live("branches", "name slug"))
    .populate(live("courses", "title slug"))
    .populate(live("assignments.branch", "name slug"))
    .populate(live("assignments.courses", "title slug"));
  ok(res, { teachers: teachers.map((t) => dropDangling(t, "assignments", "branch")) });
});

const getTeacherBySlug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    slug: req.params.slug,
    isActive: true,
    isDeleted: false,
  })
    .populate(live("branches", "name slug"))
    .populate(live("courses", "title slug"))
    // Filial üzrə dərs təyinatları — müəllim səhifəsinin əsas bölməsi.
    .populate(live("assignments.branch", "name slug"))
    .populate(live("assignments.courses", "title slug"));
  if (!teacher) {
    return fail(res, "Müəllim tapılmadı", 404);
  }

  // Vaxtlı qrafik yalnız təyinat DOLDURULMAYIB isə göstərilir — köhnə
  // məlumatlarda müəllimin dərsləri yalnız CourseGroup-da ola bilər, onda
  // səhifə boş qalmasın. Təyinat varsa o üstündür (saatsız, sadə görünüş).
  const hasAssignments = (teacher.assignments || []).length > 0;
  const groups = hasAssignments
    ? []
    : await CourseGroup.find({
        teacher: teacher._id,
        isActive: true,
        isDeleted: false,
      })
        .populate(live("course", "title slug"))
        .populate(live("branch", "name slug"));

  ok(res, {
    teacher: dropDangling(teacher, "assignments", "branch"),
    groups: groups.filter((g) => g.course && g.branch),
  });
});

export { listTeachers, getTeacherBySlug };
