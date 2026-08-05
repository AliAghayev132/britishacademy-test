// ── Course composer ──
// Builds a Course together with its per-branch pricing matrix and the
// CourseGroup timetable rows (course ↔ branch ↔ teacher ↔ schedule) in one
// request, so the admin "kurs yarat" wizard maps to a single call.
//
// No multi-document transaction is used: the local deployment runs a standalone
// mongod (transactions need a replica set). Creates are therefore best-effort
// with cleanup — if group creation fails, the just-created course is removed so
// we don't leave a half-built course behind.

import { asyncHandler } from "#utils";
import { Course, CourseGroup, Branch, Teacher, CourseCategory } from "#models";

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

/** Flatten the wizard payload into CourseGroup documents for one course. */
function toGroups(courseId, branches) {
  const docs = [];
  (branches || []).forEach((b) => {
    if (!b?.branch) return;
    (b.groups || []).forEach((g) => {
      if (!g?.teacher) return; // a group without a teacher is meaningless
      docs.push({
        course: courseId,
        branch: b.branch,
        teacher: g.teacher,
        level: g.level || undefined,
        format: g.format || "group",
        schedule: Array.isArray(g.schedule) ? g.schedule : [],
        capacity: g.capacity || undefined,
        code: g.code || undefined,
      });
    });
  });
  return docs;
}

/** Keep the denormalised teacher.branches / teacher.courses links in sync. */
async function syncTeacherLinks(courseId, branches) {
  const perTeacher = new Map(); // teacherId -> Set(branchId)
  (branches || []).forEach((b) => {
    (b.groups || []).forEach((g) => {
      if (!g?.teacher) return;
      const set = perTeacher.get(String(g.teacher)) || new Set();
      if (b.branch) set.add(String(b.branch));
      perTeacher.set(String(g.teacher), set);
    });
  });
  await Promise.all(
    [...perTeacher.entries()].map(([teacher, branchSet]) =>
      Teacher.findByIdAndUpdate(teacher, {
        $addToSet: {
          courses: courseId,
          branches: { $each: [...branchSet] },
        },
      }),
    ),
  );
}

// ── GET /api/admin/lookups ──
// Lightweight option lists for the wizard selects (branches, teachers, categories).
const getLookups = asyncHandler(async (_req, res) => {
  const [branches, teachers, categories] = await Promise.all([
    Branch.find({ isDeleted: false }).sort({ order: 1, name: 1 }).select("name address"),
    Teacher.find({ isDeleted: false })
      .sort({ order: 1, fullName: 1 })
      .select("fullName title branches color"),
    CourseCategory.find({ isDeleted: false }).sort({ order: 1, name: 1 }).select("name parent"),
  ]);
  res.json({ success: true, data: { branches, teachers, categories } });
});

// ── GET /api/admin/courses/full/:id ──
// Returns a course plus its timetable reshaped into the wizard's branch rows,
// so the edit form can be pre-filled.
const getCourseFull = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || course.isDeleted) {
    return res.status(404).json({ success: false, message: "Kurs tapılmadı" });
  }
  const groups = await CourseGroup.find({
    course: course._id,
    isDeleted: false,
  }).lean();

  // Seed branch rows from the pricing matrix (preserves order), then attach groups.
  const byBranch = new Map();
  (course.pricing || []).forEach((p) => {
    const bid = String(p.branch);
    byBranch.set(bid, {
      branch: bid,
      pricing: { group: p.group || {}, individual: p.individual || {}, note: p.note || "" },
      groups: [],
    });
  });
  groups.forEach((g) => {
    const bid = String(g.branch);
    if (!byBranch.has(bid)) {
      byBranch.set(bid, { branch: bid, pricing: { group: {}, individual: {}, note: "" }, groups: [] });
    }
    byBranch.get(bid).groups.push({
      teacher: String(g.teacher),
      level: g.level || "",
      format: g.format || "group",
      schedule: g.schedule || [],
      capacity: g.capacity,
      code: g.code || "",
    });
  });

  res.json({
    success: true,
    data: { course, branches: [...byBranch.values()] },
  });
});

// ── POST /api/admin/courses/full ──
const createCourseFull = asyncHandler(async (req, res) => {
  const { course = {}, branches = [] } = req.body || {};
  if (!course.title || !course.category) {
    return res.status(400).json({ success: false, message: "Kurs adı və kateqoriya tələb olunur" });
  }

  const created = await Course.create({
    ...course,
    pricingMode: "branch",
    pricing: toPricing(branches),
  });

  try {
    const groupDocs = toGroups(created._id, branches);
    if (groupDocs.length) {
      // create() (not insertMany) so each doc's pre-save hook runs (timeSlot…).
      await Promise.all(groupDocs.map((d) => CourseGroup.create(d)));
    }
    await syncTeacherLinks(created._id, branches);
  } catch (err) {
    await Course.findByIdAndDelete(created._id); // roll back the half-built course
    throw err;
  }

  res.status(201).json({ success: true, message: "Kurs yaradıldı", data: { course: created } });
});

// ── PUT /api/admin/courses/full/:id ──
// Updates the course + pricing, then rebuilds the timetable from the payload
// (existing groups for this course are replaced).
const updateCourseFull = asyncHandler(async (req, res) => {
  const { course = {}, branches = [] } = req.body || {};
  const doc = await Course.findById(req.params.id);
  if (!doc || doc.isDeleted) {
    return res.status(404).json({ success: false, message: "Kurs tapılmadı" });
  }

  const body = { ...course };
  delete body._id;
  delete body.slug; // keep the existing slug stable
  delete body.createdAt;
  delete body.updatedAt;
  Object.assign(doc, body, { pricingMode: "branch", pricing: toPricing(branches) });
  await doc.save();

  // Rebuild the timetable: drop old groups, recreate from the payload.
  await CourseGroup.deleteMany({ course: doc._id });
  const groupDocs = toGroups(doc._id, branches);
  if (groupDocs.length) {
    await Promise.all(groupDocs.map((d) => CourseGroup.create(d)));
  }
  await syncTeacherLinks(doc._id, branches);

  res.json({ success: true, message: "Kurs yeniləndi", data: { course: doc } });
});

export { getLookups, getCourseFull, createCourseFull, updateCourseFull };
