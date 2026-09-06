// Constants
import { Router, adminRoles } from "#constants";

// Controllers
import {
  adminController, leadController, courseComposer, devController,
  userAdminController, whatsappController, bulkController, statsController, linkController,
} from "#controllers";

// Middlewares
import { authenticate, requireRole, requireSection, writeRateLimiter } from "#middlewares";

/**
 * ADMIN API — mounted at /api/admin. NOTHING here is public.
 *
 * The router-level guard below applies to every route in this file, so any
 * endpoint added here is authenticated + role-gated by default (fail-closed).
 * Public read endpoints belong in publicRoutes.js instead.
 */
const AdminRouter = Router();

// Every admin route requires an authenticated admin/editor.
AdminRouter.use(authenticate, requireRole(adminRoles));

// Fixed routes MUST be registered before the generic /:resource matcher.
AdminRouter.get("/stats", adminController.stats);
// Məzmun statistikası — «Statistika» səhifəsi üçün. Ayrıca bölmə icazəsi var.
AdminRouter.get("/stats/content", requireSection("stats"), statsController.contentStats);
// İzlənilən linklərin hesabatı. CRUD generic /:resource ilə gedir,
// bu iki marşrut isə ondan ƏVVƏL qeydiyyatdan keçməlidir.
AdminRouter.get("/links/:id/stats", requireSection("links"), linkController.stats);
AdminRouter.delete("/links/:id/clicks", requireSection("links"), linkController.resetClicks);
// Tənzimləmələr bir SƏNƏDDƏ saxlanılır, amma üç bölmə ondan istifadə edir:
// «Tənzimləmələr» (hamısı), «Ana səhifə» (hero/marquee/stats) və QR studiyası
// (brend logosu). Ona görə oxumaq hər admin üçün açıqdır — cavab onsuz da
// maskalanır (SMTP parolu, AI açarı çıxarılır) — YAZMAQ isə sahə səviyyəsində
// yoxlanılır (bax updateSettings).
AdminRouter.get("/settings", adminController.getSettings);
AdminRouter.put("/settings", writeRateLimiter, adminController.updateSettings);
// Status dəyişmək müraciəti GÖRMƏK deməkdir — controller müraciətin növünə
// görə «leads» / «leads-abroad» yoxlayır.
AdminRouter.patch("/leads/:id/status", leadController.updateLeadStatus);

// Course composer — select lists + atomic course-with-timetable create/edit.
// Must precede the generic /:resource matcher (otherwise "lookups"/"full"
// would be read as resource names).
// Seçim siyahıları — ad/id cütlərindən ibarətdir və hamısı onsuz da public
// saytda görünür (kurs, müəllim, filial, ölkə adları). Bölmə yoxlaması YOXDUR,
// çünki bu siyahılar demək olar bütün formalarda və müraciət filtrlərində
// lazımdır. Ölkə və filial ƏHATƏSİ isə tətbiq olunur (bax getLookups).
AdminRouter.get("/lookups", courseComposer.getLookups);

// KURS KOMPOZİTORU — «courses» bölməsi tələb olunur.
//
// Bu üç marşrut generic /:resource matcher-indən ƏVVƏL qeydiyyatdan keçir,
// yəni oradakı yoxlamadan yan keçirdi. Nəticədə yalnız «müraciətlər» icazəsi
// olan admin kursu OXUYA, YARADA və DƏYİŞDİRƏ bilirdi — audit zamanı
// təsdiqləndi (POST 201, PUT 200).
AdminRouter.get("/courses/full/:id", requireSection("courses"), courseComposer.getCourseFull);
AdminRouter.post("/courses/full", requireSection("courses"), writeRateLimiter, courseComposer.createCourseFull);
AdminRouter.put("/courses/full/:id", requireSection("courses"), writeRateLimiter, courseComposer.updateCourseFull);

// ── Developer alətləri ──
// YALNIZ `developer` rolu. Bu əməliyyatlar məzmunu kütləvi dəyişir
// (seed, miqrasiya, toplu tərcümə, import) — səhv basılması bahalıdır.
const devOnly = requireRole(["developer"]);

AdminRouter.post("/dev/seed", devOnly, writeRateLimiter, devController.runSeed);
AdminRouter.post("/dev/migrate-i18n", devOnly, writeRateLimiter, devController.runMigrateI18n);
AdminRouter.post("/dev/test-mail", devOnly, writeRateLimiter, devController.runTestMail);
// AI toplu tərcümə — boş EN/RU sahələrini AZ-dan doldurur (uzun sürə bilər,
// ona görə writeRateLimiter tətbiq olunmur).
AdminRouter.post("/dev/translate-all", devOnly, devController.runAutoTranslate);
// Müştəri kurs məlumatlarını (3 dil + SEO + qiymətlər) tətbiq et.
AdminRouter.post("/dev/import-courses", devOnly, writeRateLimiter, devController.runImportCourses);
// Ölkə bayraqlarını qalereyaya endir (şəbəkə əməliyyatı — limiter yoxdur).
AdminRouter.post("/dev/import-flags", devOnly, devController.runImportFlags);
AdminRouter.post("/dev/import-teachers", devOnly, devController.runImportTeachers);
AdminRouter.post("/dev/import-branches", devOnly, devController.runImportBranches);
// Kurs sluglarını köhnə saytın ünvanlarına uyğunlaşdır (SEO trafikinin qorunması).
AdminRouter.post("/dev/migrate-slugs", devOnly, writeRateLimiter, devController.runMigrateSlugs);
// Başlıq menyusunu yenidən qur — tam seed işlətmədən.
AdminRouter.post("/dev/import-menu", devOnly, writeRateLimiter, devController.runImportMenu);
AdminRouter.post("/dev/import-contact", devOnly, writeRateLimiter, devController.runImportContact);
// Səviyyə testlərini yüklə (köhnə saytın ən çox girilən iki səhifəsi).
AdminRouter.post("/dev/import-quizzes", devOnly, writeRateLimiter, devController.runImportQuizzes);

// WhatsApp (whatsapp-web.js) — QR ilə qoşulma + mesaj göndərmə.
// Fixed paths — generic /:resource matcher-dən əvvəl olmalıdır.
// WhatsApp və toplu göndəriş — hamısı «whatsapp» bölməsindədir.
AdminRouter.use("/whatsapp", requireSection("whatsapp"));
AdminRouter.use("/bulk", requireSection("whatsapp"));

AdminRouter.get("/whatsapp/status", whatsappController.getStatus);
AdminRouter.get("/whatsapp/check", whatsappController.checkNumber);
AdminRouter.get("/whatsapp/messages", whatsappController.listMessages);
AdminRouter.post("/whatsapp/init", whatsappController.init);
AdminRouter.post("/whatsapp/send", writeRateLimiter, whatsappController.send);
AdminRouter.post("/whatsapp/send-media", writeRateLimiter, whatsappController.sendMedia);
AdminRouter.post("/whatsapp/bulk", whatsappController.bulk);
AdminRouter.post("/whatsapp/bulk/cancel", whatsappController.cancelBulk);
AdminRouter.post("/whatsapp/disconnect", whatsappController.disconnect);
AdminRouter.post("/whatsapp/logout", whatsappController.logout);

// Toplu göndəriş (WhatsApp + e-poçt) — müraciətlər / Excel / əl ilə siyahı.
// Fixed paths — generic /:resource matcher-dən əvvəl olmalıdır.
AdminRouter.get("/bulk/status", bulkController.status);
AdminRouter.post("/bulk/preview", bulkController.preview);
AdminRouter.post("/bulk/send", bulkController.send);
AdminRouter.post("/bulk/cancel", bulkController.cancel);

// Admin users (create multiple admins/editors) + audit log.
// Fixed paths — must precede the generic /:resource matcher.
// İstifadəçi idarəsi — yalnız superadmin və developer admin yarada,
// silə və rol/icazə təyin edə bilər.
const userAdmin = requireRole(["superadmin", "developer"]);

AdminRouter.get("/users", userAdmin, userAdminController.listUsers);
AdminRouter.post("/users", userAdmin, writeRateLimiter, userAdminController.createUser);
AdminRouter.put("/users/:id", userAdmin, writeRateLimiter, userAdminController.updateUser);
AdminRouter.delete("/users/:id", userAdmin, writeRateLimiter, userAdminController.removeUser);
AdminRouter.get("/logs", requireSection("logs"), userAdminController.listLogs);

// Generic CRUD over the resource registry.
AdminRouter.get("/:resource", adminController.list);
AdminRouter.get("/:resource/:id", adminController.getOne);
AdminRouter.post("/:resource", writeRateLimiter, adminController.create);
AdminRouter.patch("/:resource/reorder", writeRateLimiter, adminController.reorder);
AdminRouter.put("/:resource/:id", writeRateLimiter, adminController.update);
AdminRouter.delete("/:resource/:id", writeRateLimiter, adminController.remove);

export { AdminRouter };
