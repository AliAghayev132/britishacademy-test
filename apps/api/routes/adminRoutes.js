import { Router, adminRoles } from "#constants";
import { adminController, leadController } from "#controllers";
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

// Generic CRUD over the resource registry.
AdminRouter.get("/:resource", adminController.list);
AdminRouter.get("/:resource/:id", adminController.getOne);
AdminRouter.post("/:resource", writeRateLimiter, adminController.create);
AdminRouter.patch("/:resource/reorder", writeRateLimiter, adminController.reorder);
AdminRouter.put("/:resource/:id", writeRateLimiter, adminController.update);
AdminRouter.delete("/:resource/:id", writeRateLimiter, adminController.remove);

export { AdminRouter };
