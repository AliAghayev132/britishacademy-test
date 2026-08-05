// Generic admin CRUD over the resource registry.

// Models
import { SiteSetting, Lead } from "#models";

// Utils
import { asyncHandler } from "#utils";

// Services
import { logAction } from "#services";

// Local
import { RESOURCES } from "./resourceRegistry.js";

/** Human-readable label for a document (for audit summaries). */
const labelOf = (doc) =>
  doc?.title || doc?.name || doc?.fullName || doc?.question || doc?.label || doc?.country || String(doc?._id || "");

/** Resolve `:resource` from the URL to its registry entry (or 404). */
function resolve(req, res) {
  const entry = RESOURCES[req.params.resource];
  if (!entry) {
    res.status(404).json({ success: false, message: "Unknown resource" });
    return null;
  }
  return entry;
}

function applyPopulate(query, populate) {
  (populate || []).forEach((p) => query.populate(p));
  return query;
}

/** Escape regex metacharacters so a search term is matched literally. */
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * List every document (including inactive/unpublished — this is the admin view).
 * GET /api/admin/:resource?page=1&limit=20&search=...&sort=...
 */
const list = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  const { model, search = [], sort, softDelete = true, populate } = entry;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (softDelete) filter.isDeleted = false;
  if (req.query.search && search.length) {
    const rx = { $regex: escapeRegex(req.query.search).slice(0, 100), $options: "i" };
    filter.$or = search.map((f) => ({ [f]: rx }));
  }

  // Generic equality filters — applied only for fields the model actually has,
  // so any resource can be filtered via ?isActive=true&status=open&category=<id> etc.
  const FILTERABLE = [
    "isActive", "isFeatured", "isScholarship", "status", "type", "format",
    "pricingMode", "location", "group", "region",
    "category", "branch", "teacher", "course", "parent", "author",
  ];
  for (const key of FILTERABLE) {
    const raw = req.query[key];
    if (raw === undefined || raw === "") continue;
    if (!entry.model.schema.path(key)) continue; // resource doesn't have this field
    filter[key] = raw === "true" ? true : raw === "false" ? false : raw;
  }

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
  const item = await applyPopulate(
    entry.model.findById(req.params.id),
    entry.populate,
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  res.json({ success: true, data: { item } });
});

/** POST /api/admin/:resource */
const create = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  // Slug/defaults are handled by each model's pre-save hook.
  const item = await entry.model.create(req.body);
  await logAction(req, { action: "create", resource: req.params.resource, resourceId: item._id, summary: `${req.params.resource} yaradıldı: ${labelOf(item)}` });
  res.status(201).json({ success: true, message: "Yaradıldı", data: { item } });
});

/** PUT /api/admin/:resource/:id */
const update = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
  const item = await entry.model.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  // Never let the client rewrite immutable/system fields.
  const body = { ...req.body };
  delete body._id;
  delete body.createdAt;
  delete body.updatedAt;
  Object.assign(item, body);
  await item.save(); // runs pre-save hooks (slug, timeSlot, ...)
  await logAction(req, { action: "update", resource: req.params.resource, resourceId: item._id, summary: `${req.params.resource} yeniləndi: ${labelOf(item)}` });
  res.json({ success: true, message: "Yeniləndi", data: { item } });
});

/** DELETE /api/admin/:resource/:id — soft delete unless the resource opts out. */
const remove = asyncHandler(async (req, res) => {
  const entry = resolve(req, res);
  if (!entry) return;
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
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  await Promise.all(
    ids.map((id, index) => entry.model.findByIdAndUpdate(id, { order: index })),
  );
  res.json({ success: true, message: "Sıralama yeniləndi" });
});

/** GET /api/admin/settings — the singleton SiteSetting document. */
const getSettings = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.get();
  res.json({ success: true, data: { settings } });
});

/** PUT /api/admin/settings — partial update of the singleton. */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.get();
  const body = { ...req.body };
  delete body._id;
  delete body.key;
  delete body.createdAt;
  delete body.updatedAt;
  Object.assign(settings, body);
  await settings.save();
  await logAction(req, { action: "settings", resource: "settings", summary: "Sayt tənzimləmələri yeniləndi" });
  res.json({ success: true, message: "Tənzimləmələr yeniləndi", data: { settings } });
});

/** GET /api/admin/stats — dashboard overview: per-resource counts + new leads. */
const stats = asyncHandler(async (_req, res) => {
  const counts = {};
  await Promise.all(
    Object.entries(RESOURCES).map(async ([key, entry]) => {
      const filter = entry.softDelete === false ? {} : { isDeleted: false };
      counts[key] = await entry.model.countDocuments(filter);
    }),
  );
  const [newLeads, latestLeads] = await Promise.all([
    Lead.countDocuments({ status: "new", isDeleted: false }),
    Lead.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("course", "title")
      .populate("branch", "name"),
  ]);
  res.json({ success: true, data: { counts, newLeads, latestLeads } });
});

export { list, getOne, create, update, remove, reorder, getSettings, updateSettings, stats };
