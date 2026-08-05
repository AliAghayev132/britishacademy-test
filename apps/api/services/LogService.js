// ── Log service ──
// Fire-and-forget audit logging. Never throws into the request path.

import { AuditLog } from "#models";

/**
 * Record an admin action.
 * @param {object} req - Express request (uses req.user + req.ip)
 * @param {{action:string, resource?:string, resourceId?:string, summary?:string}} entry
 */
export async function logAction(req, { action, resource, resourceId, summary } = {}) {
  try {
    const u = req?.user || {};
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Sistem";
    await AuditLog.create({
      actor: { id: u._id, name, email: u.email, role: u.role },
      action,
      resource,
      resourceId: resourceId != null ? String(resourceId) : undefined,
      summary,
      ip: (req?.headers?.["x-forwarded-for"] || req?.ip || "").toString().split(",")[0].trim() || undefined,
    });
  } catch {
    /* logging must never break the request */
  }
}
