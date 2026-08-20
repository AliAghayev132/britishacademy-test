// ── Developer tools ──
// Admin-only maintenance endpoints. Currently: reseed the demo/content data.

import { asyncHandler } from "#utils";
import { seedDatabase, logAction, migrateI18n, autoTranslate, MailService } from "#services";

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

/**
 * POST /api/admin/dev/test-mail  { to }
 * Cari SMTP konfiqurasiyası ilə test məktubu göndərir.
 */
const runTestMail = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bu əməliyyatı edə bilər" });
  }
  const to = String(req.body?.to || "").trim();
  if (!to) {
    return res.status(400).json({ success: false, message: "Email ünvanı lazımdır" });
  }
  const result = await MailService.sendTest(to);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error || "Göndərilmədi — SMTP konfiqurasiyasını yoxlayın" });
  }
  await logAction(req, { action: "settings", resource: "dev", summary: `SMTP test məktubu göndərildi: ${to}` });
  res.json({ success: true, message: `Test məktubu göndərildi: ${to}` });
});

/**
 * POST /api/admin/dev/translate-all  { langs?, model?, limit?, overwrite? }
 * Bazadakı BOŞ EN/RU sahələrini AZ mətnindən AI ilə doldurur (OpenRouter).
 * Mövcud tərcüməyə toxunmur — təkrar işlədilə bilər.
 */
const runAutoTranslate = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bu əməliyyatı edə bilər" });
  }

  const { langs, model, limit, overwrite } = req.body || {};
  const result = await autoTranslate({
    langs: Array.isArray(langs) && langs.length ? langs : ["en", "ru"],
    model: model || undefined,
    limit: Number(limit) || 500,
    overwrite: Boolean(overwrite),
  });

  if (result.aborted) {
    return res.status(503).json({
      success: false,
      message: result.errors[0] || "AI konfiqurasiya olunmayıb (Tənzimləmələr → AI)",
      data: result,
    });
  }

  await logAction(req, {
    action: "settings",
    resource: "dev",
    summary: `AI toplu tərcümə: ${result.totalDocs} sənəd, ${result.totalFields} sahə`,
  });
  res.json({
    success: true,
    message: `Tərcümə tamamlandı — ${result.totalDocs} sənəd, ${result.totalFields} sahə (${result.totalCalls} AI sorğusu)`,
    data: result,
  });
});

export { runSeed, runMigrateI18n, runTestMail, runAutoTranslate };
