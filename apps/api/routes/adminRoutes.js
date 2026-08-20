// Constants
import { Router, adminRoles } from "#constants";

// Controllers
import { adminController, leadController, courseComposer, devController, userAdminController } from "#controllers";

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
