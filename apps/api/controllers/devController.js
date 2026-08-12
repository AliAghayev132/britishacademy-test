// ── Developer tools ──
// Admin-only maintenance endpoints. Currently: reseed the demo/content data.

import { asyncHandler } from "#utils";
import { seedDatabase, logAction, migrateI18n } from "#services";

/**
 * POST /api/admin/dev/seed
 * WIPES the BA content collections and reloads the known demo data.
 * Restricted to the "admin" role (editors cannot wipe data).
 */
const runSeed = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bu əməliyyatı edə bilər" });
  }

  const { counts } = await seedDatabase();
  await logAction(req, { action: "seed", resource: "dev", summary: "Mock data yükləndi (content əvəzləndi)" });
  res.json({
    success: true,
    message: "Mock data yükləndi (mövcud content əvəzləndi)",
    data: { counts },
  });
});

/**
 * POST /api/admin/dev/migrate-i18n
 * Köhnə string məzmun sahələrini { az, en, ru } formasına çevirir (idempotent).
 * Mövcud data itmir — mövcud dəyər AZ variantı olur.
 */
const runMigrateI18n = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bu əməliyyatı edə bilər" });
  }

  const result = await migrateI18n();
  await logAction(req, {
    action: "settings",
    resource: "dev",
    summary: `i18n miqrasiya: ${result.totalDocs} sənəd, ${result.totalFields} sahə çevrildi`,
  });
  res.json({
    success: true,
    message: `Miqrasiya tamamlandı — ${result.totalDocs} sənəd, ${result.totalFields} sahə çevrildi`,
    data: result,
  });
});

export { runSeed, runMigrateI18n };
