// Constants
import { Router, adminRoles } from "#constants";

// Controllers
import {
  adminController, leadController, courseComposer, devController,
  userAdminController, whatsappController, bulkController,
} from "#controllers";

// Middlewares
import { authenticate, requireRole, writeRateLimiter } from "#middlewares";

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
AdminRouter.get("/settings", adminController.getSettings);
AdminRouter.put("/settings", writeRateLimiter, adminController.updateSettings);
AdminRouter.patch("/leads/:id/status", leadController.updateLeadStatus);

// Course composer — select lists + atomic course-with-timetable create/edit.
// Must precede the generic /:resource matcher (otherwise "lookups"/"full"
// would be read as resource names).
AdminRouter.get("/lookups", courseComposer.getLookups);
AdminRouter.get("/courses/full/:id", courseComposer.getCourseFull);
AdminRouter.post("/courses/full", writeRateLimiter, courseComposer.createCourseFull);
AdminRouter.put("/courses/full/:id", writeRateLimiter, courseComposer.updateCourseFull);

// Developer tools — reseed demo content (admin role enforced in the controller).
AdminRouter.post("/dev/seed", writeRateLimiter, devController.runSeed);
AdminRouter.post("/dev/migrate-i18n", writeRateLimiter, devController.runMigrateI18n);
AdminRouter.post("/dev/test-mail", writeRateLimiter, devController.runTestMail);
// AI toplu tərcümə — boş EN/RU sahələrini AZ-dan doldurur (uzun sürə bilər,
// ona görə writeRateLimiter tətbiq olunmur).
AdminRouter.post("/dev/translate-all", devController.runAutoTranslate);
// Müştəri kurs məlumatlarını (3 dil + SEO + qiymətlər) tətbiq et.
AdminRouter.post("/dev/import-courses", writeRateLimiter, devController.runImportCourses);
// Ölkə bayraqlarını qalereyaya endir (şəbəkə əməliyyatı — limiter yoxdur).
AdminRouter.post("/dev/import-flags", devController.runImportFlags);
AdminRouter.post("/dev/import-teachers", devController.runImportTeachers);

// WhatsApp (whatsapp-web.js) — QR ilə qoşulma + mesaj göndərmə.
// Fixed paths — generic /:resource matcher-dən əvvəl olmalıdır.
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
AdminRouter.get("/users", userAdminController.listUsers);
AdminRouter.post("/users", writeRateLimiter, userAdminController.createUser);
AdminRouter.put("/users/:id", writeRateLimiter, userAdminController.updateUser);
AdminRouter.delete("/users/:id", writeRateLimiter, userAdminController.removeUser);
AdminRouter.get("/logs", userAdminController.listLogs);

// Generic CRUD over the resource registry.
AdminRouter.get("/:resource", adminController.list);
AdminRouter.get("/:resource/:id", adminController.getOne);
AdminRouter.post("/:resource", writeRateLimiter, adminController.create);
AdminRouter.patch("/:resource/reorder", writeRateLimiter, adminController.reorder);
AdminRouter.put("/:resource/:id", writeRateLimiter, adminController.update);
AdminRouter.delete("/:resource/:id", writeRateLimiter, adminController.remove);

export { AdminRouter };
