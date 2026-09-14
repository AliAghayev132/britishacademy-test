// ── Developer tools ──
// Admin-only maintenance endpoints (seed, i18n, import-lar).
//
// Handler-lər controllers/dev/ altındadır (ortaq şablon: dev/devTool.js); bu
// fayl marşrutların (devController.X) dəyişmədən işləməsi üçün adları ixrac edir.

export { runSeed, runMigrateI18n, runTestMail, runAutoTranslate } from "./dev/systemTools.js";
export { runImportCourses, runImportFlags, runImportTeachers, runImportBranches, runMigrateSlugs } from "./dev/dataImports.js";
export { runImportQuizzes, runImportBlog, runImportMenu, runImportContact, runImportPageContent } from "./dev/contentImports.js";
