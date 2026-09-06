// Models
import { WhatsAppLog } from "#models";
// Services
import socketService from "./SocketService.js";

/**
 * WhatsApp hadisə jurnalı.
 *
 * İKİ ÜNVANA yazır:
 *  1. bazaya — tarixçə üçün (30 gün, TTL indeksi);
 *  2. socket ilə panelə — açıq olan «Jurnal» tabı dərhal yenilənsin.
 *
 * ATƏŞ-VƏ-UNUT: jurnal yazısı heç vaxt əsas əməliyyatı sındırmamalıdır.
 * Baza əlçatmaz olsa da WhatsApp göndərişi davam etməlidir, ona görə bütün
 * xətalar udulur və yalnız konsola düşür.
 */

/** Konsolda hadisə səviyyəsinə uyğun nişan. */
const MARK = { info: "·", warn: "⚠️", error: "❌" };

/**
 * @param {string} type    WA_LOG_TYPES-dan biri
 * @param {string} message insan dilində qısa təsvir
 * @param {object} [opts]
 * @param {"info"|"warn"|"error"} [opts.level]
 * @param {object} [opts.meta]   əlavə texniki məlumat
 * @param {object} [opts.actor]  { id, email } — əməliyyatı başladan admin
 */
export function waLog(type, message, { level = "info", meta = null, actor = null } = {}) {
  const row = {
    type,
    level,
    message: String(message || "").slice(0, 1000),
    meta,
    actor: actor ? { id: actor._id || actor.id, email: actor.email } : undefined,
    createdAt: new Date(),
  };

  console.log(`${MARK[level] || "·"} WhatsApp[${type}] ${row.message}`);

  // Panelə dərhal — bazaya yazmağı gözləmədən.
  socketService.emitToRole(["admin", "superadmin", "developer"], "whatsapp:log", row);

  WhatsAppLog.create(row).catch((err) => {
    console.error("⚠️ WhatsApp jurnalı yazılmadı:", err.message);
  });
}

/**
 * Jurnalın oxunması — panel üçün səhifələnmiş siyahı.
 *
 * @param {object} q
 * @param {number} [q.page]
 * @param {number} [q.limit]
 * @param {string} [q.type]   bir hadisə növü ilə süz
 * @param {string} [q.level]  info | warn | error
 */
export async function listWaLogs({ page = 1, limit = 50, type, level } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(200, Math.max(1, Number(limit) || 50));
  const filter = {};
  if (type) filter.type = type;
  if (level) filter.level = level;

  const [items, total] = await Promise.all([
    WhatsAppLog.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
    WhatsAppLog.countDocuments(filter),
  ]);
  return { items, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } };
}

/**
 * Son 24 saatın xülasəsi — panelin yuxarısındakı vəziyyət zolağı üçün.
 * «Bu gün 3 dəfə kəsilib» kimi sualın cavabı bir sorğu ilə alınır.
 */
export async function waLogSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await WhatsAppLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { type: "$type", level: "$level" }, n: { $sum: 1 } } },
  ]);

  const byType = {};
  let errors = 0;
  let warnings = 0;
  for (const r of rows) {
    byType[r._id.type] = (byType[r._id.type] || 0) + r.n;
    if (r._id.level === "error") errors += r.n;
    if (r._id.level === "warn") warnings += r.n;
  }
  const lastError = await WhatsAppLog.findOne({ level: "error" }).sort({ createdAt: -1 }).lean();
  return {
    since,
    byType,
    errors,
    warnings,
    disconnects: byType.disconnect || 0,
    lastError: lastError && { message: lastError.message, at: lastError.createdAt },
  };
}

/** Jurnalı təmizlə — sınaqdan sonra və ya çox şişəndə. */
export async function clearWaLogs() {
  const { deletedCount } = await WhatsAppLog.deleteMany({});
  return deletedCount || 0;
}
