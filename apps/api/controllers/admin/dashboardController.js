// İdarə panelinin icmalı — resurs sayları və son müraciətlər.

// Models
import { Lead } from "#models";

// Services
import { ABROAD_INTEREST, applyLeadScope } from "#services";

// Utils
import { ok, asyncHandler, canAccessSection } from "#utils";

// Local
import { RESOURCES } from "../resourceRegistry.js";

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
    return ok(res, { counts, newLeads: 0, latestLeads: [] });
  }
  const leadFilter = { isDeleted: false };
  if (general !== abroad) {
    leadFilter.interest = general ? { $ne: ABROAD_INTEREST } : ABROAD_INTEREST;
  }
  // Filial/ölkə əhatəsi — son müraciətlər siyahısı başqa filialın adını və
  // telefonunu göstərməsin.
  applyLeadScope(leadFilter, req, "leads");

  const [newLeads, latestLeads] = await Promise.all([
    Lead.countDocuments({ ...leadFilter, status: "new" }),
    Lead.find(leadFilter)
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("course", "title")
      .populate("branch", "name"),
  ]);
  ok(res, { counts, newLeads, latestLeads });
});

export { stats };
