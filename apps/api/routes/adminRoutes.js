import { Router, adminRoles } from "#constants";
import { adminController, leadController } from "#controllers";
import { authenticate, requireRole, writeRateLimiter } from "#middlewares";

const AdminRouter = Router();

// Every admin route requires an authenticated admin/editor.
AdminRouter.use(authenticate, requireRole(adminRoles));

// Lead-specific action (before the generic :resource routes).
AdminRouter.patch("/leads/:id/status", leadController.updateLeadStatus);

// Generic CRUD over the resource registry.
AdminRouter.get("/:resource", adminController.list);
AdminRouter.get("/:resource/:id", adminController.getOne);
AdminRouter.post("/:resource", writeRateLimiter, adminController.create);
AdminRouter.patch("/:resource/reorder", writeRateLimiter, adminController.reorder);
AdminRouter.put("/:resource/:id", writeRateLimiter, adminController.update);
AdminRouter.delete("/:resource/:id", writeRateLimiter, adminController.remove);

export { AdminRouter };
