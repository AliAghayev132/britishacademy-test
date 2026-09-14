// ── Course composer ──
// Builds a Course together with its per-branch pricing matrix and the
// CourseGroup timetable rows (course ↔ branch ↔ teacher ↔ schedule) in one
// request, so the admin "kurs yarat" wizard maps to a single call.
//
// No multi-document transaction is used: the local deployment runs a standalone
// mongod (transactions need a replica set). Creates are therefore best-effort
// with cleanup — if group creation fails, the just-created course is removed so
// we don't leave a half-built course behind.

// Models
import { Course, CourseGroup, Branch, Teacher, CourseCategory, Destination } from "#models";

// Services
import { logAction } from "#services";

// Utils
import { asyncHandler, destinationScope, branchScope } from "#utils";

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
        _id: g._id || undefined,
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

/** Sənədin _id-siz surəti (yeni qrup yaratmaq və yoxlamaq üçün). */
const stripId = (d) => {
  const copy = { ...d };
  delete copy._id;
  return copy;
};

/**
 * Mövcud qrupları sihirbazdan gələnlərlə tutuşdur (saf funksiya).
 *
 * ── NİYƏ ──
 * Əvvəl kursu redaktə edəndə bütün qruplar SİLİNİB yenidən yaradılırdı.
 * Sihirbaz qrupun yalnız müəllim/səviyyə/format/qrafik/tutum/kodunu bilir —
 * qalan sahələr (başlama və bitmə tarixi, status, qeydiyyat sayı, fərdi
 * qiymət, aktivlik) İTİRDİ, deaktiv qruplar saytda yenidən görünürdü, id-lər
 * dəyişirdi. İndi:
 *   • id-si olan qrup YENİLƏNİR — yalnız göndərilən sahələr, qalanı qalır;
 *   • id-siz qrup yaradılır;
 *   • sihirbazdan silinən qrup soft-delete olunur (tarixçə qalır).
 *
 * @returns {{ updates: {doc, fields}[], creates: object[], removed: any[] }}
 */
export function planGroupSync(existing, incoming) {
  const byId = new Map((existing || []).map((g) => [String(g._id), g]));
  const kept = new Set();
  const updates = [];
  const creates = [];
  for (const item of incoming || []) {
    const fields = Object.fromEntries(Object.entries(stripId(item)).filter(([, v]) => v !== undefined));
    const id = item._id ? String(item._id) : null;
    const current = id && !kept.has(id) ? byId.get(id) : null;
    if (current) {
      updates.push({ doc: current, fields });
      kept.add(id);
    } else {
      creates.push(fields);
    }
  }
  const removed = (existing || []).filter((g) => !kept.has(String(g._id))).map((g) => g._id);
  return { updates, creates, removed };
}

// ── GET /api/admin/lookups ──
// Lightweight option lists for the wizard selects (branches, teachers, categories).
const getLookups = asyncHandler(async (req, res) => {
  // Ölkə siyahısı istifadəçinin əhatəsinə görə süzülür — filtrdə icazəsi
  // olmayan ölkə ümumiyyətlə seçim kimi görünməsin.
  const scope = destinationScope(req.user);
  const bScope = branchScope(req.user);
  // `courses` müəllim formasına lazımdır: filial üzrə hansı dərsləri
  // apardığını seçmək üçün siyahı göstərilir.
  // `destinations` müraciətlər səhifəsindəki «Bütün ölkələr» filtri üçündür.
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
  res.json({ success: true, data: { branches, teachers, categories, courses, destinations } });
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
      _id: String(g._id),
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
      await Promise.all(groupDocs.map((d) => CourseGroup.create(stripId(d))));
    }
    await syncTeacherLinks(created._id, branches);
  } catch (err) {
    await Course.findByIdAndDelete(created._id); // roll back the half-built course
    throw err;
  }

  await logAction(req, { action: "create", resource: "courses", resourceId: created._id, summary: `Kurs yaradıldı: ${created.title}` });
  res.status(201).json({ success: true, message: "Kurs yaradıldı", data: { course: created } });
});

// ── PUT /api/admin/courses/full/:id ──
// Updates the course + pricing and syncs the timetable with the payload:
// existing groups are updated in place, not recreated (see planGroupSync).
const updateCourseFull = asyncHandler(async (req, res) => {
  const { course = {}, branches = [] } = req.body || {};
  const doc = await Course.findById(req.params.id);
  if (!doc || doc.isDeleted) {
    return res.status(404).json({ success: false, message: "Kurs tapılmadı" });
  }

  // Qruplar kurs yenilənməzdən ƏVVƏL yoxlanılır — bir səhv qrup yarımçıq
  // yenilənmə yaratmasın (əvvəl köhnə qruplar silinir, sonra yaratma yıxılırdı).
  const incoming = toGroups(doc._id, branches);
  await Promise.all(incoming.map((d) => new CourseGroup(stripId(d)).validate()));

  const body = { ...course };
  delete body._id;
  delete body.slug; // keep the existing slug stable
  delete body.createdAt;
  delete body.updatedAt;
  Object.assign(doc, body, { pricingMode: "branch", pricing: toPricing(branches) });
  await doc.save();

  // Qrafik: mövcud qruplar yerində yenilənir, yeniləri yaradılır, sihirbazdan
  // silinənlər soft-delete olunur (bax planGroupSync).
  const existing = await CourseGroup.find({ course: doc._id, isDeleted: false });
  const plan = planGroupSync(existing, incoming);
  for (const { doc: group, fields } of plan.updates) {
    Object.assign(group, fields);
    await group.save(); // pre-save (timeSlot) işləsin
  }
  await Promise.all(plan.creates.map((d) => CourseGroup.create(d)));
  if (plan.removed.length) {
    await CourseGroup.updateMany({ _id: { $in: plan.removed } }, { isDeleted: true, isActive: false });
  }
  await syncTeacherLinks(doc._id, branches);

  await logAction(req, { action: "update", resource: "courses", resourceId: doc._id, summary: `Kurs yeniləndi: ${doc.title}` });
  res.json({ success: true, message: "Kurs yeniləndi", data: { course: doc } });
});

export { getLookups, getCourseFull, createCourseFull, updateCourseFull };
