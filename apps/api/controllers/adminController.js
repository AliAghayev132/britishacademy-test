// Generic admin CRUD over the resource registry.

// Models
import { SiteSetting, Lead } from "#models";

// Utils
import { asyncHandler, fuzzyRegex, hasRole, destinationScope, branchScope, canAccessSection } from "#utils";

// Services
import { logAction } from "#services";

// Local
import { RESOURCES, RESOURCE_SECTION } from "./resourceRegistry.js";

/** Human-readable label for a document (for audit summaries). */
const labelOf = (doc) =>
  doc?.title || doc?.name || doc?.fullName || doc?.question || doc?.label || doc?.country || String(doc?._id || "");

/**
 * «Xaricdə təhsil» müraciətinin əlaməti.
 *
 * Panel bu dəyəri süzgəc kimi göndərir (ApplyModal onu müraciətə belə yazır),
 * server isə icazə sərhədini onunla çəkir. İkisi eyni sətir olmalıdır —
 * `tests/leadSections.test.js` bunu təsbit edir.
 */
export const ABROAD_INTEREST = "Xaricdə təhsil";

/** Resolve `:resource` from the URL to its registry entry (or 404). */
function resolve(req, res) {
  const entry = RESOURCES[req.params.resource];
  if (!entry) {
    res.status(404).json({ success: false, message: "Unknown resource" });
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
    res.status(403).json({ success: false, message: "Bu bölməyə icazəniz yoxdur" });
    return true;
  }
  if (sections.some((s) => canAccessSection(req.user, s))) return false;
  res.status(403).json({ success: false, message: "Bu bölməyə icazəniz yoxdur" });
  return true;
}

/**
 * Müraciətləri istifadəçinin bölmə icazəsinə görə süz.
 *
 * • hər ikisi           → süzgəc yoxdur
 * • yalnız «leads»      → xaricdə təhsil müraciətləri GİZLƏNİR
 * • yalnız «leads-abroad» → YALNIZ onlar görünür
 *
 * Sərhəd serverdədir: arayüzdə bəndi gizlətmək kifayət deyil, sorğu əl ilə
 * dəyişdirilə bilər.
 */
function applyLeadAccess(filter, req, resource) {
  if (resource !== "leads") return filter;
  const general = canAccessSection(req.user, "leads");
  const abroad = canAccessSection(req.user, "leads-abroad");
  if (general && abroad) return filter;

  const cond = general
    ? { interest: { $ne: ABROAD_INTEREST } }
    : { interest: ABROAD_INTEREST };
  filter.$and = [...(filter.$and || []), cond];
  return filter;
}

/** Bu müraciət istifadəçinin bölmə icazəsinə düşürmü? */
function canSeeLead(user, lead) {
  const isAbroad = lead?.interest === ABROAD_INTEREST;
  return canAccessSection(user, isAbroad ? "leads-abroad" : "leads");
}

/**
 * Yazma nəticəsində müraciət istifadəçinin ÖZ görmə sahəsindən çıxırmı?
 *
 * NƏ ÜÇÜN: sərhəd oxumada qorunurdu, yazmada isə yox. Yalnız «müraciətlər»
 * icazəsi olan adam gördüyü müraciətin maraq növünü «Xaricdə təhsil»ə
 * dəyişəndə sənəd onun siyahısından YOX OLURDU — özü də baxa bilmədiyi
 * bölməyə düşürdü. Səlahiyyət artımı deyil, amma müraciəti cavabsız
 * qoymağın səssiz yoludur; eyni hal ölkə və filial əhatəsində də var.
 *
 * Qayda: istifadəçi müraciəti YALNIZ özünün girişi olan bölməyə/əhatəyə
 * köçürə bilər. Hər ikisinə icazəsi olan (və ya məhdudiyyətsiz) adam
 * sərbəstdir — yəni düzəliş işi bloklanmır, sadəcə məsul şəxsə qalır.
 *
 * @returns {string|null} çıxarılan sahənin adı, yoxsa null
 */
export function movesLeadOutOfReach(user, patch) {
  if (patch.interest !== undefined && !canSeeLead(user, patch)) return "maraq növü";

  const dScope = destinationScope(user);
  if (dScope && patch.destinations !== undefined) {
    const ids = (Array.isArray(patch.destinations) ? patch.destinations : []).map(String);
    // Ölkəsiz müraciət əhatədən kənar sayılmır (bax applyLeadScope) — ona
    // görə yalnız DOLU siyahı yoxlanılır.
    if (ids.length && !ids.some((d) => dScope.includes(d))) return "ölkə";
  }

  const bScope = branchScope(user);
  if (bScope && patch.branch) {
    if (!bScope.includes(String(patch.branch))) return "filial";
  }
  return null;
}

/**
 * İstifadəçinin ölkə əhatəsini sorğuya tətbiq edir.
 *
 * YALNIZ `leads` resursuna aiddir. Məhdudiyyət SERVERDƏ qoyulur — filtri
 * yalnız arayüzdə gizlətmək təhlükəsizlik deyil: istifadəçi sorğunu əl ilə
 * dəyişib başqa ölkənin müraciətlərini görə bilərdi.
 *
 * Şərt iki hala baxır:
 *   • müraciətdə icazə verilən ölkələrdən ən azı biri var, VƏ YA
 *   • müraciət ümumiyyətlə ölkəsizdir (adi kurs müraciəti) — belələri
 *     ölkə məhdudiyyətindən kənardır, əks halda məhdud admin adi
 *     müraciətləri də görməzdi.
 */
function applyLeadScope(filter, req, resource) {
  if (resource !== "leads") return filter;
  const and = [];

  // Ölkə əhatəsi — xaricdə təhsil müraciətləri.
  const dScope = destinationScope(req.user);
  if (dScope) {
    and.push({
      $or: [
        { destinations: { $in: dScope } },
        { destinations: { $size: 0 } },
        { destinations: { $exists: false } },
      ],
    });
  }

  // Filial əhatəsi — adi müraciətlər. Filialsız müraciətlər (ziyarətçi filial
  // seçməyib) kənarda qalmır: əks halda məhdud admin onları heç görməzdi və
  // müraciət cavabsız qalardı.
  const bScope = branchScope(req.user);
  if (bScope) {
    and.push({
      $or: [{ branch: { $in: bScope } }, { branch: null }, { branch: { $exists: false } }],
    });
  }

  // Mövcud $and-a əlavə edirik ki, axtarışdakı $or ilə toqquşmasın.
  if (and.length) filter.$and = [...(filter.$and || []), ...and];
  return filter;
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

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

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
  const dateField = entry.model.schema.path("createdAt") ? "createdAt" : null;
  if (dateField) {
    const range = {};
    const from = req.query.from;
    const to = req.query.to;
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) range.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        range.$lte = d;
      }
    }
    if (Object.keys(range).length) filter[dateField] = range;
  }

  // Əhatə məhdudiyyətləri — sorğudan ƏVVƏL, yəni sayğac da məhdud nəticəyə
  // görə çıxır.
  applyLeadScope(filter, req, req.params.resource);
  applyLeadAccess(filter, req, req.params.resource);

  const [items, total] = await Promise.all([
    applyPopulate(model.find(filter).sort(sort).skip(skip).limit(limit), populate),
    model.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
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
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  // Siyahı məhduddursa tək sənəd də məhdud olmalıdır — əks halda id-ni
  // bilən istifadəçi icazəsi olmayan müraciəti aça bilərdi.
  if (req.params.resource === "leads") {
    // Bölmə icazəsi: adi müraciətlərə baxa bilən adam id ilə xaricdə təhsil
    // müraciətini aça bilməməlidir (və əksinə).
    if (!canSeeLead(req.user, item)) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const dScope = destinationScope(req.user);
    const own = (item.destinations || []).map(String);
    if (dScope && own.length && !own.some((d) => dScope.includes(d))) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    const bScope = branchScope(req.user);
    const b = item.branch ? String(item.branch._id || item.branch) : null;
    if (bScope && b && !bScope.includes(b)) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
  }
  res.json({ success: true, data: { item } });
});

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
      return res.status(403).json({
        success: false,
        message: `Bu ${out} üzrə müraciət yaratmağa icazəniz yoxdur`,
      });
    }
  }
  // Slug/defaults are handled by each model's pre-save hook.
  const item = await entry.model.create(req.body);
  await logAction(req, { action: "create", resource: req.params.resource, resourceId: item._id, summary: `${req.params.resource} yaradıldı: ${labelOf(item)}` });
  res.status(201).json({ success: true, message: "Yaradıldı", data: { item } });
});

/** PUT /api/admin/:resource/:id */
const update = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  const item = await entry.model.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  if (req.params.resource === "leads" && !canSeeLead(req.user, item)) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  // Never let the client rewrite immutable/system fields.
  const body = { ...req.body };
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;
  // Müraciəti öz görmə sahəsindən ÇIXARMAQ olmaz.
  if (req.params.resource === "leads") {
    const out = movesLeadOutOfReach(req.user, body);
    if (out) {
      return res.status(403).json({
        success: false,
        message: `Müraciəti başqa ${out} altına köçürməyə icazəniz yoxdur`,
      });
    }
  }
  Object.assign(item, body);
  await item.save(); // runs pre-save hooks (slug, timeSlot, ...)
  await logAction(req, { action: "update", resource: req.params.resource, resourceId: item._id, summary: `${req.params.resource} yeniləndi: ${labelOf(item)}` });
  res.json({ success: true, message: "Yeniləndi", data: { item } });
});

/** DELETE /api/admin/:resource/:id — soft delete unless the resource opts out. */
const remove = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  if (req.params.resource === "leads") {
    const lead = await entry.model.findById(req.params.id).select("interest");
    if (lead && !canSeeLead(req.user, lead)) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
  }
  if (entry.softDelete === false) {
    await entry.model.findByIdAndDelete(req.params.id);
  } else {
    await entry.model.findByIdAndUpdate(req.params.id, { isDeleted: true });
  }
  await logAction(req, { action: "delete", resource: req.params.resource, resourceId: req.params.id, summary: `${req.params.resource} silindi` });
  res.json({ success: true, message: "Silindi" });
});

/**
 * Bulk reorder: PATCH /api/admin/:resource/reorder  body: { ids: [id, ...] }
 * Writes the array index back to each doc's `order` field.
 */
const reorder = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  if (denySection(req, res, req.params.resource)) return;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  await Promise.all(
    ids.map((id, index) => entry.model.findByIdAndUpdate(id, { order: index })),
  );
  res.json({ success: true, message: "Sıralama yeniləndi" });
});

/**
 * Yalnız `admin` rolunun dəyişə biləcəyi tənzimləmə blokları.
 *
 * ⚠️ Bunların hamısı infrastruktur/təhlükəsizlik təsirlidir:
 *  - smtp / ai            → kimlik məlumatları və API açarları
 *  - codeInjection        → saytın hər səhifəsində ixtiyari skript
 *  - robotsTxt            → axtarış indeksləşməsini söndürə bilər
 *  - organizationSchema   → JSON-LD inyeksiyası
 *  - maxImageSizeKb       → yükləmə limiti
 * `editor` rolu məzmun sahələrini (contact, hero, seo mətnləri, stats…) dəyişə bilər.
 */
/** «Ana səhifə» bölməsinin idarə etdiyi tənzimləmə blokları. */
const HOME_SETTING_FIELDS = ["homeSections", "hero", "marquee", "stats"];

const ADMIN_ONLY_SETTING_FIELDS = [
  "smtp", "ai", "codeInjection", "robotsTxt", "organizationSchema", "maxImageSizeKb",
];

/** Gizli açarları cavabdan çıxar (yalnız-yazma; var/yox işarəsi qalır). */
function maskSettings(settings) {
  const out = typeof settings?.toObject === "function" ? settings.toObject() : { ...settings };
  if (out.smtp) out.smtp = { ...out.smtp, hasPass: Boolean(out.smtp.pass), pass: "" };
  if (out.ai) out.ai = { ...out.ai, hasKey: Boolean(out.ai.apiKey), apiKey: "" };
  return out;
}

/** GET /api/admin/settings — the singleton SiteSetting document. */
const getSettings = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.get();
  res.json({ success: true, data: { settings: maskSettings(settings) } });
});

/** PUT /api/admin/settings — partial update of the singleton. */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.get();
  const body = { ...req.body };

  // «Ana səhifə» bölməsi də bu endpointə yazır (hero, lent, statistika).
  // Ona görə iki icazədən biri kifayətdir, LAKİN yalnız «home» icazəsi olan
  // adam qalan bloklara — SMTP, AI, brend, SEO, kod inyeksiyası — toxuna
  // bilməməlidir. Əvvəl endpoint tamamilə açıq idi.
  const canSettings = canAccessSection(req.user, "settings");
  const canHome = canAccessSection(req.user, "home");
  if (!canSettings && !canHome) {
    return res.status(403).json({ success: false, message: "Bu bölməyə icazəniz yoxdur" });
  }
  if (!canSettings) {
    for (const key of Object.keys(body)) {
      if (!HOME_SETTING_FIELDS.includes(key)) delete body[key];
    }
  }
  delete body._id;
  delete body.key;
  delete body.createdAt;
  delete body.updatedAt;

  // Editor privilegiyalı blokları göndərsə — sükutla at (səhv redaktə cəzalandırılmasın,
  // amma dəyişiklik də tətbiq olunmasın).
  if (!hasRole(req.user, "admin")) {
    const blocked = ADMIN_ONLY_SETTING_FIELDS.filter((f) => f in body);
    for (const f of blocked) delete body[f];
    if (blocked.length) {
      console.warn(`⚠️ settings: ${req.user?.email || "editor"} admin-only sahələri dəyişməyə çalışdı: ${blocked.join(", ")}`);
    }
  }

  // Gizli açar boş gəlibsə köhnəsini saxla (frontend geri almır).
  if (body.smtp && !body.smtp.pass) {
    body.smtp = { ...body.smtp, pass: settings.smtp?.pass || "" };
  }
  if (body.ai && !body.ai.apiKey) {
    body.ai = { ...body.ai, apiKey: settings.ai?.apiKey || "" };
  }
  Object.assign(settings, body);
  await settings.save();
  await logAction(req, { action: "settings", resource: "settings", summary: "Sayt tənzimləmələri yeniləndi" });
  // Cavabda da maskala — əks halda parol/açar admin panelə geri qayıdırdı.
  res.json({ success: true, message: "Tənzimləmələr yeniləndi", data: { settings: maskSettings(settings) } });
});

/** GET /api/admin/stats — dashboard overview: per-resource counts + new leads. */
const stats = asyncHandler(async (req, res) => {
  const counts = {};
  await Promise.all(
    Object.entries(RESOURCES).map(async ([key, entry]) => {
      const filter = entry.softDelete === false ? {} : { isDeleted: false };
      counts[key] = await entry.model.countDocuments(filter);
    }),
  );

  // İdarə paneli hər admin üçün açıqdır, amma son müraciətlərin adı və
  // telefonu müraciət icazəsi olmayana getməməlidir. Bölünmə də qorunur:
  // yalnız «leads» icazəsi olan adam burada xaricdə təhsil müraciətini
  // görməməlidir.
  const general = canAccessSection(req.user, "leads");
  const abroad = canAccessSection(req.user, "leads-abroad");
  if (!general && !abroad) {
    return res.json({ success: true, data: { counts, newLeads: 0, latestLeads: [] } });
  }
  const leadFilter = { isDeleted: false };
  if (general !== abroad) {
    leadFilter.interest = general ? { $ne: ABROAD_INTEREST } : ABROAD_INTEREST;
  }

  const [newLeads, latestLeads] = await Promise.all([
    Lead.countDocuments({ ...leadFilter, status: "new" }),
    Lead.find(leadFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("course", "title")
      .populate("branch", "name"),
  ]);
  res.json({ success: true, data: { counts, newLeads, latestLeads } });
});

export { list, getOne, create, update, remove, reorder, getSettings, updateSettings, stats };
