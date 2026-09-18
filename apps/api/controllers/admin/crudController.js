// Generic admin CRUD over the resource registry.

// Lib
import { mongoose } from "#lib";

// Services
import {
  logAction,
  diffDocs,
  redact,
  pickFields,
  applyLeadAccess,
  applyLeadTopic,
  applyLeadScope,
  canSeeLead,
  leadInReach,
  movesLeadOutOfReach,
} from "#services";

// Utils
import {
  fail,
  ok,
  pageInfo,
  parsePage,
  asyncHandler,
  fuzzyRegex,
  destinationScope,
  branchScope,
  canAccessSection,
  dateRange,
} from "#utils";

// Local
import { RESOURCES, RESOURCE_SECTION, labelForResource } from "../resourceRegistry.js";

/**
 * Sənədin oxunaqlı adı (audit jurnalı üçün).
 *
 * ÇOXDİLLİ SAHƏLƏR DÜZLƏŞDİRİLİR: `title` artıq `{ az, en, ru }` obyektidir,
 * ona görə jurnala «courses yeniləndi: [object Object]» düşürdü — yəni hansı
 * kursun dəyişdiyi görünmürdü.
 */
const az = (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? v.az || v.en || v.ru || "" : v;

const labelOf = (doc) =>
  az(doc?.title) || az(doc?.name) || az(doc?.fullName) || az(doc?.question)
  || az(doc?.label) || az(doc?.country) || String(doc?._id || "");

/** Resolve `:resource` from the URL to its registry entry (or 404). */
function resolve(req, res) {
  const entry = RESOURCES[req.params.resource];
  if (!entry) {
    fail(res, "Unknown resource", 404);
    return null;
  }
  return entry;
}

/**
 * Bu resursa girişi olan bölmələr.
 *
 * Müraciətlər İKİ bölməyə bölünür: adi müraciətlər («leads») və xaricdə
 * təhsil müraciətləri («leads-abroad»). Onları ayrı adamlar aparır, ona görə
 * birinə icazə vermək o birini açmamalıdır. Hər ikisi bir resursda
 * saxlanıldığı üçün sərhəd SORĞUDA çəkilir — bax `applyLeadAccess`.
 */
function sectionsFor(resource) {
  if (resource === "leads") return ["leads", "leads-abroad"];
  const s = RESOURCE_SECTION[resource];
  return s ? [s] : [];
}

/**
 * Bölmə icazəsini yoxla. `true` qaytarırsa çağıran davam etməməlidir.
 *
 * ƏVVƏL BU YOXLAMA ÜMUMİYYƏTLƏ YOX İDİ: `/admin/:resource` marşrutları
 * yalnız «admin roludur?» yoxlamasından keçirdi. Yəni icazələr praktikada
 * yalnız sidebar-ı gizlədirdi — sorğunu əl ilə yazan istifadəçi bütün
 * resursları oxuya və dəyişə bilirdi.
 */
function denySection(req, res, resource) {
  const sections = sectionsFor(resource);
  // Reyestrdə olmayan resurs — fail-closed.
  if (!sections.length) {
    fail(res, "Bu bölməyə icazəniz yoxdur", 403);
    return true;
  }
  if (sections.some((s) => canAccessSection(req.user, s))) return false;
  fail(res, "Bu bölməyə icazəniz yoxdur", 403);
  return true;
}

function applyPopulate(query, populate) {
  (populate || []).forEach((p) => query.populate(p));
  return query;
}


/**
 * List every document (including inactive/unpublished — this is the admin view).
 * GET /api/admin/:resource?page=1&limit=20&search=...&sort=...
 */
const list = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  const { model, search = [], sort, softDelete = true, populate } = entry;

  const { page, limit, skip } = parsePage(req.query);

  const filter = {};
  if (softDelete) filter.isDeleted = false;
  if (req.query.search && search.length) {
    const rx = fuzzyRegex(req.query.search); // AZ-tolerant (İ/ı/ə/ş/ç/ğ/ö/ü)
    // Həm köhnə string, həm yeni { az,en,ru } formasını axtar (miqrasiya keçidi).
    filter.$or = search.flatMap((f) => [
      { [f]: rx }, { [`${f}.az`]: rx }, { [`${f}.en`]: rx }, { [`${f}.ru`]: rx },
    ]);
  }

  // Generic equality filters — applied only for fields the model actually has,
  // so any resource can be filtered via ?isActive=true&status=open&category=<id> etc.
  const FILTERABLE = [
    "isActive", "isFeatured", "isScholarship", "status", "type", "format",
    "pricingMode", "location", "group", "region", "source",
    "category", "branch", "teacher", "course", "parent", "author",
    "folder", // qalereya bölməsi
    // Xaricdə təhsil müraciətləri: massiv sahədir, Mongo bərabərlik
    // müqayisəsini massiv elementlərinə də tətbiq edir — ayrıca kod lazım deyil.
    "destinations",
    // Müraciətin maraq növü («Xaricdə təhsil», «IELTS» …). Sidebar-dakı
    // ayrıca «Xaricdə təhsil müraciətləri» bölməsi bununla süzülür.
    "interest",
  ];
  for (const key of FILTERABLE) {
    const raw = req.query[key];
    if (raw === undefined || raw === "") continue;
    if (!entry.model.schema.path(key)) continue; // resource doesn't have this field
    filter[key] = raw === "true" ? true : raw === "false" ? false : raw;
  }

  // ── Tarix aralığı ──
  // Müraciətlərdə «bu həftə nə gəldi» ən çox verilən sualdır; əvvəl yalnız
  // bərabərlik filtrləri vardı. `to` günün SONUNA qədər götürülür, əks halda
  // eyni günü seçəndə heç nə tapılmırdı (00:00-dan 00:00-a aralıq boşdur).
  // Günlər Bakı vaxtı ilə (audit #39) — server saatından asılı deyil.
  const dateField = entry.model.schema.path("createdAt") ? "createdAt" : null;
  if (dateField) {
    const range = dateRange(req.query.from, req.query.to);
    if (range) filter[dateField] = range;
  }

  // Əhatə məhdudiyyətləri — sorğudan ƏVVƏL, yəni sayğac da məhdud nəticəyə
  // görə çıxır.
  applyLeadScope(filter, req, req.params.resource);
  applyLeadAccess(filter, req, req.params.resource);
  applyLeadTopic(filter, req, req.params.resource);

  const [items, total] = await Promise.all([
    applyPopulate(model.find(filter).sort(sort).skip(skip).limit(limit), populate),
    model.countDocuments(filter),
  ]);

  ok(res, {
    items,
    pagination: pageInfo({ page, limit }, total),
  });
});

/** GET /api/admin/:resource/:id */
const getOne = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  const item = await applyPopulate(
    entry.model.findById(req.params.id),
    entry.populate,
  );
  // Silinmiş sənəd siyahıda görünmür — id ilə də açılmamalıdır.
  if (!item || item.isDeleted) {
    return fail(res, "Not found", 404);
  }
  // Siyahı məhduddursa tək sənəd də məhdud olmalıdır — əks halda id-ni
  // bilən istifadəçi icazəsi olmayan müraciəti aça bilərdi.
  if (req.params.resource === "leads") {
    // Bölmə icazəsi: adi müraciətlərə baxa bilən adam id ilə xaricdə təhsil
    // müraciətini aça bilməməlidir (və əksinə).
    if (!canSeeLead(req.user, item)) {
      return fail(res, "Not found", 404);
    }
    const dScope = destinationScope(req.user);
    const own = (item.destinations || []).map(String);
    if (dScope && own.length && !own.some((d) => dScope.includes(d))) {
      return fail(res, "Not found", 404);
    }
    const bScope = branchScope(req.user);
    const b = item.branch ? String(item.branch._id || item.branch) : null;
    if (bScope && b && !bScope.includes(b)) {
      return fail(res, "Not found", 404);
    }
  }
  ok(res, { item });
});

/**
 * Klientin YAZA BİLMƏYƏCƏYİ sistem sahələri.
 *
 * Əvvəl create/update req.body-ni olduğu kimi yazırdı: redaktor silinmiş
 * elementi `isDeleted: false` ilə bərpa edə, `views`/`clicks` sayğaclarını,
 * `createdBy`/`handledBy` kimi sahələri dəyişə bilirdi — audit log isə bu
 * sahələri qeyd etmirdi.
 */
const SYSTEM_FIELDS = [
  "_id", "__v", "createdAt", "updatedAt", "isDeleted",
  "views", "clicks", "lastClickAt",
  "createdBy", "uploadedBy", "handledBy", "handledAt", "tokenVersion",
];

export const stripSystemFields = (body = {}) => {
  const out = { ...(body || {}) };
  for (const f of SYSTEM_FIELDS) delete out[f];
  return out;
};

/** POST /api/admin/:resource */
const create = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  // Müraciəti YALNIZ öz bölməsinə/əhatəsinə yaratmaq olar — əks halda
  // istifadəçi baxa bilmədiyi yerə sənəd ata bilərdi.
  if (req.params.resource === "leads") {
    const out = movesLeadOutOfReach(req.user, req.body || {});
    if (out) {
      return fail(res, `Bu ${out} üzrə müraciət yaratmağa icazəniz yoxdur`, 403);
    }
  }
  // Slug/defaults are handled by each model's pre-save hook.
  const data = stripSystemFields(req.body);
  // Yaradan serverdə qoyulur — klientin göndərdiyi dəyər qəbul edilmir.
  if (entry.model.schema.path("createdBy")) data.createdBy = req.user?._id;
  const item = await entry.model.create(data);
  await logAction(req, {
    action: "create", resource: req.params.resource, resourceId: item._id,
    summary: `${labelForResource(req.params.resource)} yaradıldı: ${labelOf(item)}`,
    // Yaradılan sənədin ÖZÜ — əvvəl yalnız «yaradıldı» yazılırdı, nə ilə
    // yaradıldığı heç yerdə qalmırdı.
    details: { after: redact(item) },
  });
  ok(res, { item }, "Yaradıldı", 201);
});

/** PUT /api/admin/:resource/:id */
const update = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  const item = await entry.model.findById(req.params.id);
  // Silinmiş sənəd redaktə olunmur — əvvəl `isDeleted: false` ilə bərpa olurdu.
  if (!item || item.isDeleted) {
    return fail(res, "Not found", 404);
  }
  // Bölmə VƏ filial/ölkə əhatəsi — oxuma ilə eyni qayda (bax leadInReach).
  if (req.params.resource === "leads" && !leadInReach(req.user, item)) {
    return fail(res, "Not found", 404);
  }
  // Klient sistem sahələrini yaza bilməz (bax SYSTEM_FIELDS).
  const body = stripSystemFields(req.body);
  // Müraciəti öz görmə sahəsindən ÇIXARMAQ olmaz.
  if (req.params.resource === "leads") {
    const out = movesLeadOutOfReach(req.user, body);
    if (out) {
      return fail(res, `Müraciəti başqa ${out} altına köçürməyə icazəniz yoxdur`, 403);
    }
  }
  // Dəyişiklikdən ƏVVƏLKİ nüsxə — jurnalda «nə idi → nə oldu» üçün.
  // Surət `Object.assign`-dan əvvəl götürülməlidir, sonra gec olur.
  const before = item.toObject();

  Object.assign(item, body);
  await item.save(); // runs pre-save hooks (slug, timeSlot, ...)

  // Yalnız GÖNDƏRİLƏN sahələr müqayisə olunur — PUT sənədin bir hissəsini
  // göndərir, tam sənədlə tutuşdursaq göndərilməyən hər sahə «dəyişdi»
  // kimi görünərdi.
  const changes = diffDocs(before, Object.fromEntries(
    Object.keys(body).map((k) => [k, item[k]]),
  ));
  const touched = changes.map((c) => c.field);
  await logAction(req, {
    action: "update", resource: req.params.resource, resourceId: item._id,
    summary: `${labelForResource(req.params.resource)} yeniləndi: ${labelOf(item)}`,
    changes,
    // Yalnız DƏYİŞƏN sahələr — bütöv sənədi yazmaq jurnalı şişirdərdi,
    // modalda isə oxumaq çətinləşərdi.
    details: touched.length
      ? { before: pickFields(before, touched), after: pickFields(item, touched) }
      : undefined,
  });
  ok(res, { item }, "Yeniləndi");
});

/** DELETE /api/admin/:resource/:id — soft delete unless the resource opts out. */
const remove = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  if (req.params.resource === "leads") {
    const lead = await entry.model.findById(req.params.id).select("interest destinations branch");
    if (lead && !leadInReach(req.user, lead)) {
      return fail(res, "Not found", 404);
    }
  }
  // Silinməzdən əvvəl adını götür — sonra sənəd tapılmır və jurnalda
  // yalnız id qalırdı, yəni «nə silindi» sualına cavab yox idi.
  const doomed = await entry.model.findById(req.params.id).lean();
  // Olmayan və ya artıq silinmiş sənəd — əvvəl «silindi» cavabı verilir və
  // jurnala boş qeyd düşürdü.
  if (!doomed || doomed.isDeleted) {
    return fail(res, "Not found", 404);
  }

  if (entry.softDelete === false) {
    await entry.model.findByIdAndDelete(req.params.id);
  } else {
    await entry.model.findByIdAndUpdate(req.params.id, { isDeleted: true });
  }
  await logAction(req, {
    action: "delete", resource: req.params.resource, resourceId: req.params.id,
    summary: `${labelForResource(req.params.resource)} silindi${doomed ? `: ${labelOf(doomed)}` : ""}`,
    // Silinən sənəd tam saxlanılır — bərpa lazım gələrsə istinad buradır.
    details: doomed ? { before: redact(doomed) } : undefined,
  });
  ok(res, null, "Silindi");
});

/**
 * Yeni sıranı hesabla (saf funksiya).
 *
 * `all` — cari sıra ilə bütün elementlər, `ids` — paneldə yenidən düzülmüş
 * alt çoxluq (bir səhifə və ya axtarış nəticəsi). Həmin elementlər
 * tutduqları YERLƏRİN içində yeni ardıcıllıqla yerləşdirilir, qalanlar
 * yerində qalır; sonra hamı 0..n-1 nömrələnir. Yalnız `order`-i dəyişənlər
 * qaytarılır.
 *
 * @returns {Array<{id:string, order:number}> | null}  null — heç biri tapılmadı
 */
export function planReorder(all, ids) {
  const position = new Map(all.map((d, i) => [String(d._id), i]));
  const moved = ids.map(String).filter((id) => position.has(id));
  if (!moved.length) return null;

  const next = all.map((d) => String(d._id));
  const slots = moved.map((id) => position.get(id)).sort((a, b) => a - b);
  slots.forEach((slot, i) => { next[slot] = moved[i]; });

  const current = new Map(all.map((d) => [String(d._id), d.order]));
  return next
    .map((id, order) => ({ id, order }))
    .filter(({ id, order }) => current.get(id) !== order);
}

/**
 * Toplu sıralama: PATCH /api/admin/:resource/reorder
 * body: { ids: [id, ...], start?: number }
 *
 * `ids` — elementlərin İSTƏNİLƏN sırası; hər birinin `order` sahəsinə massivdəki
 * mövqeyi yazılır.
 *
 * `start` — SƏHİFƏ SÜRÜŞMƏSİ. Panel yalnız CARİ SƏHİFƏNİN id-lərini göndərir.
 * Sürüşmə olmasa 2-ci səhifə də 0-dan nömrələnər və 1-ci səhifə ilə tam
 * toqquşardı — siyahı gözlə görünən şəkildə qarışardı.
 */
const reorder = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;

  // Sırası olmayan modeldə (müraciətlər, media…) `order` yazmaq sxemə yad
  // sahə əlavə etmək və heç nəyə təsir etməmək demək idi.
  if (!entry.model.schema.path("order")) {
    return fail(res, "Bu bölmədə sıralama yoxdur", 400);
  }

  const raw = Array.isArray(req.body?.ids) ? req.body.ids : [];
  // Yararsız id `findByIdAndUpdate`-i CastError ilə çökdürürdü (500).
  const ids = [...new Set(raw.map(String))].filter((id) => mongoose.isValidObjectId(id));
  if (!ids.length) {
    return fail(res, "Sıralanacaq element göndərilməyib", 400);
  }
  if (ids.length > 200) {
    return fail(res, "Bir dəfəyə ən çox 200 element", 400);
  }

  // BÜTÜN siyahı yenidən nömrələnir (audit #26). Əvvəl yalnız cari səhifəyə
  // `start + i` yazılırdı; qalan səhifələr 0-da qalır, birinci elementlə
  // bərabərləşib ada görə düzülür və birinci səhifəyə sıçrayırdı.
  // `start` artıq lazım deyil — klient göndərsə də nəzərə alınmır.
  const softDelete = entry.softDelete !== false && entry.model.schema.path("isDeleted");
  const all = await entry.model
    .find(softDelete ? { isDeleted: false } : {})
    .sort(entry.sort || { order: 1 })
    .select("_id order")
    .lean();
  const ops = planReorder(all, ids);
  if (ops === null) {
    return fail(res, "Göndərilən elementlər tapılmadı", 400);
  }
  if (ops.length) {
    await entry.model.bulkWrite(
      ops.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } },
      })),
    );
  }
  await logAction(req, {
    action: "reorder", resource: req.params.resource,
    summary: `${labelForResource(req.params.resource)}: ${ids.length} elementin sırası dəyişdi`,
  });
  ok(res, null, "Sıralama yeniləndi");
});

export { list, getOne, create, update, remove, reorder };
