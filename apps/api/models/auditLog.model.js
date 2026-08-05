import { Schema, Model } from "#constants";

/**
 * AuditLog — who did what in the admin panel.
 *
 * Written fire-and-forget by LogService.logAction() from the admin mutations
 * (create/update/delete/settings/seed/login/user management). Read-only from
 * the UI (/dashboard/loglar).
 */
const auditLogSchema = new Schema(
  {
    actor: {
      id: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    action: { type: String, required: true }, // create | update | delete | settings | seed | login | user
    resource: { type: String, trim: true }, // e.g. "courses", "teachers", "users"
    resourceId: { type: String, trim: true },
    summary: { type: String, trim: true }, // human-readable, e.g. 'Kurs "IELTS" yaradıldı'
    ip: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

export const AuditLog = Model("AuditLog", auditLogSchema);
