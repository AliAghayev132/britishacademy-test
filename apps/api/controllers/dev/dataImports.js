// Services
import {
  importCourseData,
  importFlags,
  importTeacherAssignments,
  importBranchData,
  migrateCourseSlugs,
} from "#services";

// Local
import { devTool, dryRunOption } from "./devTool.js";

/**
 * POST /api/admin/dev/import-courses  { dryRun? }
 * Müştəridən gələn kurs məlumatlarını (3 dilli mətn, SEO, filial qiymətləri)
 * mövcud kurslara tətbiq edir. İdempotentdir.
 */
const runImportCourses = devTool({
  options: dryRunOption,
  run: ({ dryRun }) => importCourseData({ dryRun }),
  summary: (result, { dryRun }) => !dryRun && `Kurs məlumatları import edildi: ${result.updated}/${result.total}`,
  message: (result, { dryRun }) =>
    dryRun
      ? `Yoxlama: ${result.updated}/${result.total} kurs hazırdır`
      : `${result.updated}/${result.total} kurs yeniləndi`,
});

/**
 * POST /api/admin/dev/import-flags  { overwrite? }
 * Ölkə bayraqlarını flagcdn.com-dan qalereyaya endirir və ölkə kartlarına
 * bağlayır. Fayllar lokala yazılır — sayt kənar CDN-dən asılı qalmır.
 */
const runImportFlags = devTool({
  options: (req) => ({ overwrite: Boolean(req.body?.overwrite) }),
  run: ({ overwrite }) => importFlags({ overwrite }),
  summary: (result) => `Bayraqlar endirildi: ${result.imported}/${result.total}`,
  message: (result) => `${result.imported} bayraq endirildi, ${result.skipped} ötürüldü`,
});

/**
 * Müəllim → filial → dərs təyinatlarının importu.
 *
 * Müştəri siyahısını (39 müəllim) bazaya yazır: mövcud müəllimi ada görə
 * tapır, yoxdursa yaradır. Dərs saatı yazılmır. Təkrar işlədilə bilər.
 */
const runImportTeachers = devTool({
  options: (req) => ({ dryRun: Boolean(req.body?.dryRun), replace: req.body?.replace !== false }),
  run: ({ dryRun, replace }) => importTeacherAssignments({ dryRun, replace }),
  summary: (result, { dryRun }) =>
    !dryRun && `Müəllim təyinatları: ${result.created} yeni, ${result.updated} yeniləndi`,
  message: (result, { dryRun }) =>
    dryRun
      ? `Quru rejim: ${result.created} yaradılacaq, ${result.updated} yenilənəcək`
      : `${result.created} müəllim yaradıldı, ${result.updated} yeniləndi`,
});

/**
 * Filial əlaqə məlumatlarının importu (ünvan, telefon, WhatsApp, xəritə).
 *
 * Seed BÜTÜN məzmunu silir, ona görə mövcud saytda işlədilə bilməz. Bu isə
 * yalnız filial sətirlərini yeniləyir.
 */
const runImportBranches = devTool({
  options: dryRunOption,
  run: ({ dryRun }) => importBranchData({ dryRun }),
  summary: (result, { dryRun }) =>
    !dryRun && `Filial məlumatları: ${result.updated} yeniləndi, ${result.created} yaradıldı`,
  message: (result, { dryRun }) =>
    dryRun
      ? `Quru rejim: ${result.updated} yenilənəcək, ${result.created} yaradılacaq`
      : `${result.updated} filial yeniləndi, ${result.created} yaradıldı`,
});

/**
 * POST /api/admin/dev/migrate-slugs
 *
 * Kurs slug-larını köhnə saytın (daha çox axtarılan) ünvanlarına uyğunlaşdırır.
 * Seed faylı artıq yeni sluglarla gəlir, amma seed bütün məzmunu silir — canlı
 * saytda yalnız bu miqrasiya işlədilə bilər. İdempotentdir.
 */
const runMigrateSlugs = devTool({
  options: dryRunOption,
  run: ({ dryRun }) => migrateCourseSlugs({ dryRun }),
  // Heç nə dəyişməyibsə jurnala boş sətir yazılmır.
  summary: (result, { dryRun }) => !dryRun && result.renamed && `Kurs slugları: ${result.renamed} yeniləndi`,
  message: (result, { dryRun }) =>
    dryRun
      ? `${result.renamed} slug dəyişəcək (sınaq rejimi)`
      : `${result.renamed} slug yeniləndi`,
});

export { runImportCourses, runImportFlags, runImportTeachers, runImportBranches, runMigrateSlugs };
