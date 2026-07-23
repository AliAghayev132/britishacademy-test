// Generic admin CRUD over the resource registry.
import { asyncHandler } from "#utils";
import { RESOURCES } from "./resourceRegistry.js";

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
    const rx = { $regex: String(req.query.search), $options: "i" };
    filter.$or = search.map((f) => ({ [f]: rx }));
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

export { list, getOne, create, update, remove, reorder };
