// ── Developer tools ──
// Admin-only maintenance endpoints. Currently: reseed the demo/content data.

import { asyncHandler } from "#utils";
import { seedDatabase, logAction } from "#services";

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

export { runSeed };
