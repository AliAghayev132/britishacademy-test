// ── Course composer ──
// Builds a Course together with its per-branch pricing matrix in one request,
// so the admin "kurs yarat" wizard maps to a single call.
//
// Əvvəl burada «dərs qrafiki» (kurs ↔ filial ↔ müəllim ↔ saat) da qurulurdu.
// O sistem çıxarıldı: kursu keçən müəllimlər birbaşa kursda saxlanılır
// (Course.teachers), saat və həftə günü heç yerdə yoxdur.

// Models
import { Course, Branch, Teacher, CourseCategory, Destination } from "#models";

// Services
import { logAction } from "#services";

// Utils
import { fail, ok, asyncHandler, cleanIds, destinationScope, branchScope } from "#utils";

// ── Helpers ──

/** Reshape the wizard payload's branch rows into Course.pricing[] entries. */
function toPricing(branches) {
  return (branches || [])
    .filter((b) => b?.branch)
    .map((b) => ({
      branch: b.branch,
      group: b.pricing?.group || {},
      individual: b.pricing?.individual || {},
      note: b.pricing?.note || undefined,
    }));
}

/**
 * Sihirbazdan gələn kurs gövdəsi.
 *
 * `teachers` ayrıca təmizlənir: açıq endpoint olmasa da, klientin göndərdiyi
 * siyahıya etibar etmirik — yalnız ObjectId formasındakı dəyərlər keçir.
 */
function toCourseBody(course = {}) {
  const body = { ...course };
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;
  body.teachers = cleanIds(course.teachers, 50);
  return body;
}

// ── GET /api/admin/lookups ──
// Lightweight option lists for the wizard selects (branches, teachers, categories).
const getLookups = asyncHandler(async (req, res) => {
  // Ölkə siyahısı istifadəçinin əhatəsinə görə süzülür — filtrdə icazəsi
  // olmayan ölkə ümumiyyətlə seçim kimi görünməsin.
  const scope = destinationScope(req.user);
  const bScope = branchScope(req.user);
  // `courses` müraciət və test formalarındaki kurs seçimləri üçündür,
  // `destinations` isə müraciətlər səhifəsindəki «Bütün ölkələr» filtri üçün.
  const [branches, teachers, categories, courses, destinations] = await Promise.all([
    Branch.find({ isDeleted: false, ...(bScope ? { _id: { $in: bScope } } : {}) })
      .sort({ order: 1, name: 1 })
      .select("name address"),
    Teacher.find({ isDeleted: false })
      .sort({ order: 1, fullName: 1 })
      .select("fullName title branches color"),
    CourseCategory.find({ isDeleted: false }).sort({ order: 1, name: 1 }).select("name parent"),
    Course.find({ isDeleted: false }).sort({ order: 1, title: 1 }).select("title slug"),
    Destination.find({ isDeleted: false, ...(scope ? { _id: { $in: scope } } : {}) })
      .sort({ order: 1, country: 1 })
      .select("country slug"),
  ]);
  ok(res, { branches, teachers, categories, courses, destinations });
});

// ── GET /api/admin/courses/full/:id ──
// Returns a course plus its pricing matrix reshaped into the wizard's branch
// rows, so the edit form can be pre-filled.
const getCourseFull = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || course.isDeleted) {
    return fail(res, "Kurs tapılmadı", 404);
  }

  const branches = (course.pricing || []).map((p) => ({
    branch: String(p.branch),
    pricing: { group: p.group || {}, individual: p.individual || {}, note: p.note || "" },
  }));

  ok(res, { course, branches });
});

// ── POST /api/admin/courses/full ──
const createCourseFull = asyncHandler(async (req, res) => {
  const { course = {}, branches = [] } = req.body || {};
  if (!course.title || !course.category) {
    return fail(res, "Kurs adı və kateqoriya tələb olunur", 400);
  }

  const created = await Course.create({
    ...toCourseBody(course),
    pricingMode: "branch",
    pricing: toPricing(branches),
  });

  await logAction(req, { action: "create", resource: "courses", resourceId: created._id, summary: `Kurs yaradıldı: ${created.title}` });
  ok(res, { course: created }, "Kurs yaradıldı", 201);
});

// ── PUT /api/admin/courses/full/:id ──
const updateCourseFull = asyncHandler(async (req, res) => {
  const { course = {}, branches = [] } = req.body || {};
  const doc = await Course.findById(req.params.id);
  if (!doc || doc.isDeleted) {
    return fail(res, "Kurs tapılmadı", 404);
  }

  const body = toCourseBody(course);
  delete body.slug; // keep the existing slug stable
  Object.assign(doc, body, { pricingMode: "branch", pricing: toPricing(branches) });
  await doc.save();

  await logAction(req, { action: "update", resource: "courses", resourceId: doc._id, summary: `Kurs yeniləndi: ${doc.title}` });
  ok(res, { course: doc }, "Kurs yeniləndi");
});

export { getLookups, getCourseFull, createCourseFull, updateCourseFull };
