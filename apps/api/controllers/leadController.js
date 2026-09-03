// Lead capture — the "Müraciət et" modal and contact form post here.
import { asyncHandler, isObjectId, cleanIds } from "#utils";
import { Lead } from "#models";

/**
 * POST /api/leads — public. Rate-limited at the route.
 * Minimal validation; everything else is optional context.
 */
const createLead = asyncHandler(async (req, res) => {
  const { name, phone, email, course, branch, interest, message, source, pageUrl } =
    req.body;

  // Ölkə seçimi yalnız massiv kimi qəbul olunur və ObjectId formasına
  // uyğunluğu yoxlanılır — açıq endpointdir, gələn dəyərə etibar etmirik.
  const destinations = cleanIds(req.body?.destinations, 12);

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: "Ad və telefon mütləqdir",
    });
  }

  const lead = await Lead.create({
    name,
    phone,
    email,
    course: course || undefined,
    branch: branch || undefined,
    interest,
    message,
    source,
    pageUrl,
    destinations: destinations.length ? destinations : undefined,
    // Layihə müraciəti — yalnız layihənin öz səhifəsindən gəlir.
    project: isObjectId(req.body?.project) ? req.body.project : undefined,
  });

  res.status(201).json({
    success: true,
    message: "Müraciətin qəbul edildi! Tezliklə səninlə əlaqə saxlayacağıq.",
    data: { id: lead._id },
  });
});

/** PATCH /api/admin/leads/:id/status — admin marks a lead handled. */
const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    return res.status(404).json({ success: false, message: "Müraciət tapılmadı" });
  }
  if (status) lead.status = status;
  if (note !== undefined) lead.note = note;
  lead.handledBy = req.user._id;
  lead.handledAt = new Date();
  await lead.save();
  res.json({ success: true, message: "Yeniləndi", data: { lead } });
});

export { createLead, updateLeadStatus };
