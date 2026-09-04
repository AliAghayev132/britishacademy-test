// ── Developer tools ──
// Admin-only maintenance endpoints. Currently: reseed the demo/content data.

import { asyncHandler } from "#utils";
import { seedDatabase, logAction, migrateI18n, autoTranslate, importCourseData, importFlags, importTeacherAssignments, importBranchData, migrateCourseSlugs, importQuizzes, MailService, importHeaderMenu, importContactI18n } from "#services";
import { HEADER_MENU } from "../services/SeedService.js";
import { tri } from "../data/translations.mjs";

/**
 * POST /api/admin/dev/seed
 * WIPES the BA content collections and reloads the known demo data.
 * Restricted to the "admin" role (editors cannot wipe data).
 */
const runSeed = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
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
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
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
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
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
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
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

/**
 * POST /api/admin/dev/import-courses  { dryRun? }
 * Müştəridən gələn kurs məlumatlarını (3 dilli mətn, SEO, filial qiymətləri)
 * mövcud kurslara tətbiq edir. İdempotentdir.
 */
const runImportCourses = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await importCourseData({ dryRun });

  if (!dryRun) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Kurs məlumatları import edildi: ${result.updated}/${result.total}`,
    });
  }
  res.json({
    success: true,
    message: dryRun
      ? `Yoxlama: ${result.updated}/${result.total} kurs hazırdır`
      : `${result.updated}/${result.total} kurs yeniləndi`,
    data: result,
  });
});

/**
 * POST /api/admin/dev/import-flags  { overwrite? }
 * Ölkə bayraqlarını flagcdn.com-dan qalereyaya endirir və ölkə kartlarına
 * bağlayır. Fayllar lokala yazılır — sayt kənar CDN-dən asılı qalmır.
 */
const runImportFlags = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const result = await importFlags({ overwrite: Boolean(req.body?.overwrite) });
  await logAction(req, {
    action: "settings",
    resource: "dev",
    summary: `Bayraqlar endirildi: ${result.imported}/${result.total}`,
  });
  res.json({
    success: true,
    message: `${result.imported} bayraq endirildi, ${result.skipped} ötürüldü`,
    data: result,
  });
});

/**
 * Müəllim → filial → dərs təyinatlarının importu.
 *
 * Müştəri siyahısını (39 müəllim) bazaya yazır: mövcud müəllimi ada görə
 * tapır, yoxdursa yaradır. Dərs saatı yazılmır. Təkrar işlədilə bilər.
 */
const runImportTeachers = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await importTeacherAssignments({
    dryRun,
    replace: req.body?.replace !== false,
  });
  if (!dryRun) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Müəllim təyinatları: ${result.created} yeni, ${result.updated} yeniləndi`,
    });
  }
  res.json({
    success: true,
    message: dryRun
      ? `Quru rejim: ${result.created} yaradılacaq, ${result.updated} yenilənəcək`
      : `${result.created} müəllim yaradıldı, ${result.updated} yeniləndi`,
    data: result,
  });
});

/**
 * Filial əlaqə məlumatlarının importu (ünvan, telefon, WhatsApp, xəritə).
 *
 * Seed BÜTÜN məzmunu silir, ona görə mövcud saytda işlədilə bilməz. Bu isə
 * yalnız filial sətirlərini yeniləyir.
 */
const runImportBranches = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await importBranchData({ dryRun });
  if (!dryRun) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Filial məlumatları: ${result.updated} yeniləndi, ${result.created} yaradıldı`,
    });
  }
  res.json({
    success: true,
    message: dryRun
      ? `Quru rejim: ${result.updated} yenilənəcək, ${result.created} yaradılacaq`
      : `${result.updated} filial yeniləndi, ${result.created} yaradıldı`,
    data: result,
  });
});

/**
 * POST /api/admin/dev/migrate-slugs
 *
 * Kurs slug-larını köhnə saytın (daha çox axtarılan) ünvanlarına uyğunlaşdırır.
 * Seed faylı artıq yeni sluglarla gəlir, amma seed bütün məzmunu silir — canlı
 * saytda yalnız bu miqrasiya işlədilə bilər. İdempotentdir.
 */
const runMigrateSlugs = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await migrateCourseSlugs({ dryRun });
  if (!dryRun && result.renamed) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Kurs slugları: ${result.renamed} yeniləndi`,
    });
  }
  res.json({
    success: true,
    message: dryRun
      ? `${result.renamed} slug dəyişəcək (sınaq rejimi)`
      : `${result.renamed} slug yeniləndi`,
    data: result,
  });
});

/**
 * POST /api/admin/dev/import-quizzes
 *
 * İngilis və Rus dili səviyyə testlərini yükləyir. Mövcud test
 * TOXUNULMUR (admin sualları redaktə etmiş ola bilər) — üzərinə yazmaq
 * üçün `overwrite: true` göndərilir.
 */
const runImportQuizzes = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const overwrite = Boolean(req.body?.overwrite);
  const result = await importQuizzes({ dryRun, overwrite });
  if (!dryRun) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Testlər: ${result.created} yaradıldı, ${result.replaced} əvəz olundu`,
    });
  }
  res.json({
    success: true,
    message: `${result.created} yaradıldı, ${result.replaced} əvəz olundu, ${result.skipped} toxunulmadı`,
    data: result,
  });
});

/**
 * POST /api/admin/dev/import-menu
 *
 * Başlıq menyusunu yenidən qurur. Menyu quruluşu dəyişəndə tam seed
 * işlətməmək üçündür: bu əməliyyat YALNIZ header menyusuna toxunur, kurslar,
 * müəllimlər və müraciətlər yerində qalır.
 */
const runImportMenu = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await importHeaderMenu(HEADER_MENU, tri, { dryRun });
  if (!dryRun) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Menyu yeniləndi: ${result.before} → ${result.after} bənd`,
    });
  }
  res.json({
    success: true,
    message: dryRun
      ? `${result.after} bənd quraşdırılacaq (sınaq rejimi)`
      : `Menyu yeniləndi — ${result.after} bənd`,
    data: result,
  });
});

/**
 * POST /api/admin/dev/import-contact
 * «Əlaqə» tənzimləmələrindəki ünvan və iş saatlarını 3 dilə tamamlayır.
 * Sahələr sonradan çoxdilli edildi; canlı bazadakı köhnə sətirlər isə yalnız
 * AZ qalmışdı və hər səhifədə (üst lent, footer) azərbaycanca görünürdü.
 */
const runImportContact = asyncHandler(async (req, res) => {
  if (req.user?.role !== "developer") {
    return res.status(403).json({ success: false, message: "Yalnız developer bu əməliyyatı edə bilər" });
  }
  const dryRun = Boolean(req.body?.dryRun);
  const result = await importContactI18n(tri, { dryRun, force: Boolean(req.body?.force) });
  if (!dryRun && result.applied) {
    await logAction(req, {
      action: "settings",
      resource: "dev",
      summary: `Əlaqə tərcümələri yeniləndi: ${result.applied} sahə`,
    });
  }
  res.json({
    success: true,
    message: result.applied
      ? `${result.applied} sahə 3 dilə tamamlandı${dryRun ? " (sınaq rejimi)" : ""}`
      : "Dəyişiklik lazım deyil — hər şey artıq tərcümə olunub",
    data: result,
  });
});

export { runImportContact, runSeed, runMigrateI18n, runTestMail, runAutoTranslate, runImportCourses, runImportFlags, runImportTeachers, runImportBranches, runMigrateSlugs, runImportQuizzes, runImportMenu };
