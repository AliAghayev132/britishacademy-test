// WhatsApp admin idarəetməsi — qoşulma (QR / pairing kod), mesaj və toplu göndəriş.
// Bütün marşrutlar /api/admin/whatsapp/* altındadır (router səviyyəsində auth).

// Models
import { WhatsAppMessage } from "#models";

// Services
import {
  WhatsAppService,
  BulkQueue,
  renderTemplate,
  logAction,
  listWaLogs,
  waLogSummary,
  clearWaLogs,
  waLog,
  LibVersion,
} from "#services";

// Utils
import { fail, ok, pageInfo, parsePage, asyncHandler, hasRole } from "#utils";

/** Kitabxana yoxdursa 503 qaytar (hər yerdə eyni mesaj). */
async function requireLib(res) {
  const lib = await WhatsAppService._load();
  if (!lib) {
    fail(res, "whatsapp-web.js quraşdırılmayıb — serverdə `npm i whatsapp-web.js qrcode` işə salın", 503);
    return false;
  }
  return true;
}

/** GET /api/admin/whatsapp/status */
const getStatus = asyncHandler(async (_req, res) => {
  await WhatsAppService._load();
  // Versiya vəziyyəti ilə birlikdə — panel «yeni versiya var» xəbərdarlığını
  // buradan alır. `check` keşlidir (gündə bir dəfə şəbəkəyə çıxır).
  const [version, summary] = await Promise.all([
    LibVersion.check().catch(() => LibVersion.getState()),
    waLogSummary().catch(() => null),
  ]);
  ok(res, {
    ...WhatsAppService.getStatus(),
    queue: BulkQueue.getState(),
    version,
    logSummary: summary,
  });
});

/** GET /api/admin/whatsapp/logs — hadisə jurnalı (səhifələnmiş). */
const getLogs = asyncHandler(async (req, res) => {
  const data = await listWaLogs({
    page: req.query.page,
    limit: req.query.limit,
    type: req.query.type,
    level: req.query.level,
  });
  ok(res, data);
});

/** DELETE /api/admin/whatsapp/logs — jurnalı təmizlə. */
const removeLogs = asyncHandler(async (req, res) => {
  if (!hasRole(req.user, "admin")) {
    return fail(res, "Jurnalı yalnız admin təmizləyə bilər", 403);
  }
  const n = await clearWaLogs();
  waLog("session", `Jurnal təmizləndi (${n} sətir)`, { level: "warn", actor: req.user });
  await logAction(req, { action: "settings", resource: "whatsapp", summary: `WhatsApp jurnalı təmizləndi: ${n} sətir` });
  ok(res, null, `${n} sətir silindi`);
});

/** POST /api/admin/whatsapp/version/check — versiyanı İNDİ yoxla. */
const checkVersion = asyncHandler(async (_req, res) => {
  const data = await LibVersion.check({ force: true });
  ok(res, data);
});

/**
 * POST /api/admin/whatsapp/init   body: { pairPhone? }
 * Klienti başladır. `initialize()` uzun çəkdiyi üçün gözləmirik — status
 * endpoint-i (polling) QR-i / qoşulma kodunu və hazır olma vəziyyətini göstərir.
 * `pairPhone` verilsə QR əvəzinə 8 rəqəmli qoşulma kodu istənilir.
 */
const init = asyncHandler(async (req, res) => {
  if (!hasRole(req.user, "admin")) {
    return fail(res, "WhatsApp qoşulmasını yalnız admin idarə edə bilər", 403);
  }
  if (WhatsAppService.isReady) {
    return ok(res, WhatsAppService.getStatus(), "WhatsApp artıq qoşulub");
  }
  if (!(await requireLib(res))) return;

  const pairPhone = req.body?.pairPhone || null;
  WhatsAppService.init({ pairPhone }).catch(() => {}); // arxa fonda
  await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp başladıldı" });
  res.json({
    success: true,
    message: pairPhone ? "Qoşulma kodu hazırlanır…" : "WhatsApp başladılır — QR kodu gözləyin",
  });
});

/** GET /api/admin/whatsapp/check?phone=... — nömrə WhatsApp-da varmı */
const checkNumber = asyncHandler(async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return fail(res, "Telefon nömrəsi tələb olunur", 400);
  try {
    const result = await WhatsAppService.checkNumber(phone);
    ok(res, result);
  } catch (err) {
    fail(res, err.message, 400);
  }
});

/**
 * POST /api/admin/whatsapp/send  { phone, message, lead?, vars? }
 * Tək mesaj. `vars` verilsə mesajda {{ad}} kimi dəyişənlər əvəzlənir.
 */
const send = asyncHandler(async (req, res) => {
  const { phone, message, lead, vars } = req.body || {};
  if (!phone || !message) {
    return fail(res, "Telefon nömrəsi və mesaj məcburidir", 400);
  }
  const body = renderTemplate(message, vars || {});
  const normalized = WhatsAppService.normalizePhone(phone);

  try {
    await WhatsAppService.sendMessage(normalized, body);
  } catch (err) {
    await WhatsAppMessage.create({
      phone: normalized, body, status: "failed", error: err.message,
      source: lead ? "lead" : "manual", lead: lead || undefined, sentBy: req.user?._id,
    }).catch(() => {});
    return fail(res, err.message, 400);
  }

  await WhatsAppMessage.create({
    phone: normalized, body, status: "sent",
    source: lead ? "lead" : "manual", lead: lead || undefined, sentBy: req.user?._id,
  }).catch(() => {});
  await logAction(req, {
    action: "settings", resource: "whatsapp",
    summary: `WhatsApp mesaj göndərildi: ${normalized}`,
  });
  ok(res, null, "Mesaj göndərildi");
});

/**
 * POST /api/admin/whatsapp/send-media  { phone, base64, mimetype?, filename?, caption? }
 *
 * ⚠️ Fayl JSON body-də base64 kimi gəlir. Express body limiti 10 MB-dır
 * (securityConfig.maxPayloadSize) və base64 ~33% şişirdir → REAL limit ~7 MB.
 * Ondan böyük fayl body parser-də anlaşılmaz 413 verirdi; burada aydın mesaj
 * qaytarırıq. Daha böyük fayllar üçün multipart /api/media/upload-video
 * işlədilməli və nəticə URL kimi göndərilməlidir.
 */
const MAX_MEDIA_BYTES = 7 * 1024 * 1024;

const sendMedia = asyncHandler(async (req, res) => {
  const { phone, base64, mimetype, filename, caption } = req.body || {};
  if (!phone || !base64) {
    return fail(res, "Telefon nömrəsi və fayl məcburidir", 400);
  }
  // base64 uzunluğundan təxmini bayt ölçüsü
  const approxBytes = Math.floor((String(base64).length * 3) / 4);
  if (approxBytes > MAX_MEDIA_BYTES) {
    const mb = Math.round(approxBytes / 1024 / 1024);
    const maxMb = MAX_MEDIA_BYTES / 1024 / 1024;
    return fail(res, "Fayl çox böyükdür (" + mb + " MB). WhatsApp ilə birbaşa göndəriş üçün maksimum " + maxMb + " MB.", 413);
  }
  const normalized = WhatsAppService.normalizePhone(phone);
  try {
    await WhatsAppService.sendMedia({ phone: normalized, base64, mimetype, filename, caption });
  } catch (err) {
    return fail(res, err.message, 400);
  }
  await WhatsAppMessage.create({
    phone: normalized, body: caption || "", status: "sent", source: "manual",
    media: { filename, mimetype }, sentBy: req.user?._id,
  }).catch(() => {});
  await logAction(req, { action: "settings", resource: "whatsapp", summary: `WhatsApp fayl göndərildi: ${normalized}` });
  ok(res, null, "Fayl göndərildi");
});

/*
 * Köhnə POST /whatsapp/bulk və /whatsapp/bulk/cancel silindi (audit #42).
 * Onların ayrıca «işləyir» bayrağı vardı: yeni /bulk növbəsi ilə eyni anda
 * işləyib mesajlar arası gecikməni iki dəfə azaldırdı — nömrənin bloklanma
 * riski. Toplu göndəriş yalnız bulkController (BulkQueue) ilə gedir.
 */

/** GET /api/admin/whatsapp/messages?page=&limit=&status=&phone= — göndəriş tarixçəsi */
const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.phone) filter.phone = new RegExp(WhatsAppService.normalizePhone(req.query.phone));

  const [items, total] = await Promise.all([
    WhatsAppMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sentBy", "name email")
      .lean(),
    WhatsAppMessage.countDocuments(filter),
  ]);

  ok(res, { items, pagination: pageInfo({ page, limit }, total) });
});

/** POST /api/admin/whatsapp/disconnect — bağla, sessiyanı SAXLA. */
const disconnect = asyncHandler(async (req, res) => {
  if (!hasRole(req.user, "admin")) {
    return fail(res, "Yalnız admin bağlaya bilər", 403);
  }
  await WhatsAppService.disconnect();
  await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp bağlandı" });
  ok(res, null, "WhatsApp bağlandı (sessiya saxlanıldı)");
});

/** POST /api/admin/whatsapp/logout — cihazı ayır + sessiyanı sil (yeni QR tələb olunur). */
const logout = asyncHandler(async (req, res) => {
  if (!hasRole(req.user, "admin")) {
    return fail(res, "Yalnız admin bu əməliyyatı edə bilər", 403);
  }
  await WhatsAppService.clearSession();
  await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp sessiyası silindi" });
  ok(res, null, "Sessiya silindi — yenidən QR skan etmək lazımdır");
});

export {
  getStatus, init, checkNumber, send, sendMedia,
  listMessages, disconnect, logout, getLogs, removeLogs, checkVersion };
