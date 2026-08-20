// WhatsApp admin idarəetməsi — qoşulma (QR / pairing kod), mesaj və toplu göndəriş.
// Bütün marşrutlar /api/admin/whatsapp/* altındadır (router səviyyəsində auth).

// Models
import { WhatsAppMessage, Lead } from "#models";

// Services
import { WhatsAppService, WhatsAppQueue, renderTemplate, logAction } from "#services";

// Utils
import { asyncHandler } from "#utils";

/** Kitabxana yoxdursa 503 qaytar (hər yerdə eyni mesaj). */
async function requireLib(res) {
  const lib = await WhatsAppService._load();
  if (!lib) {
    res.status(503).json({
      success: false,
      message: "whatsapp-web.js quraşdırılmayıb — serverdə `npm i whatsapp-web.js qrcode` işə salın",
    });
    return false;
  }
  return true;
}

/** GET /api/admin/whatsapp/status */
const getStatus = asyncHandler(async (_req, res) => {
  await WhatsAppService._load();
  res.json({
    success: true,
    data: { ...WhatsAppService.getStatus(), queue: WhatsAppQueue.getState() },
  });
});

/**
 * POST /api/admin/whatsapp/init   body: { pairPhone? }
 * Klienti başladır. `initialize()` uzun çəkdiyi üçün gözləmirik — status
 * endpoint-i (polling) QR-i / qoşulma kodunu və hazır olma vəziyyətini göstərir.
 * `pairPhone` verilsə QR əvəzinə 8 rəqəmli qoşulma kodu istənilir.
 */
const init = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "WhatsApp qoşulmasını yalnız admin idarə edə bilər" });
  }
  if (WhatsAppService.isReady) {
    return res.json({ success: true, message: "WhatsApp artıq qoşulub", data: WhatsAppService.getStatus() });
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
  if (!phone) return res.status(400).json({ success: false, message: "Telefon nömrəsi tələb olunur" });
  try {
    const result = await WhatsAppService.checkNumber(phone);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/whatsapp/send  { phone, message, lead?, vars? }
 * Tək mesaj. `vars` verilsə mesajda {{ad}} kimi dəyişənlər əvəzlənir.
 */
const send = asyncHandler(async (req, res) => {
  const { phone, message, lead, vars } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: "Telefon nömrəsi və mesaj məcburidir" });
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
    return res.status(400).json({ success: false, message: err.message });
  }

  await WhatsAppMessage.create({
    phone: normalized, body, status: "sent",
    source: lead ? "lead" : "manual", lead: lead || undefined, sentBy: req.user?._id,
  }).catch(() => {});
  await logAction(req, {
    action: "settings", resource: "whatsapp",
    summary: `WhatsApp mesaj göndərildi: ${normalized}`,
  });
  res.json({ success: true, message: "Mesaj göndərildi" });
});

/** POST /api/admin/whatsapp/send-media  { phone, base64, mimetype?, filename?, caption? } */
const sendMedia = asyncHandler(async (req, res) => {
  const { phone, base64, mimetype, filename, caption } = req.body || {};
  if (!phone || !base64) {
    return res.status(400).json({ success: false, message: "Telefon nömrəsi və fayl məcburidir" });
  }
  const normalized = WhatsAppService.normalizePhone(phone);
  try {
    await WhatsAppService.sendMedia({ phone: normalized, base64, mimetype, filename, caption });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  await WhatsAppMessage.create({
    phone: normalized, body: caption || "", status: "sent", source: "manual",
    media: { filename, mimetype }, sentBy: req.user?._id,
  }).catch(() => {});
  await logAction(req, { action: "settings", resource: "whatsapp", summary: `WhatsApp fayl göndərildi: ${normalized}` });
  res.json({ success: true, message: "Fayl göndərildi" });
});

/**
 * POST /api/admin/whatsapp/bulk
 * body: { template, phones?: string[], leadStatus?: string, skipDuplicates?: boolean }
 *
 * `leadStatus` verilsə həmin statusdakı müraciətlərin nömrələrinə göndərilir və
 * mesajda {{ad}} / {{telefon}} dəyişənləri müraciət məlumatı ilə doldurulur.
 */
const bulk = asyncHandler(async (req, res) => {
  // Kütləvi göndəriş şirkət nömrəsinin bloklanmasına səbəb ola bilər — yalnız admin.
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Toplu göndərişi yalnız admin başlada bilər" });
  }
  const { template, phones, leadStatus, skipDuplicates = true } = req.body || {};
  if (!template?.trim()) {
    return res.status(400).json({ success: false, message: "Mesaj mətni məcburidir" });
  }

  let recipients = [];
  if (leadStatus) {
    const filter = { isDeleted: false };
    if (leadStatus !== "all") filter.status = leadStatus;
    const leads = await Lead.find(filter).select("name phone").limit(1000).lean();
    recipients = leads
      .filter((l) => l.phone)
      .map((l) => ({ phone: l.phone, lead: l._id, vars: { ad: l.name || "", telefon: l.phone } }));
  } else if (Array.isArray(phones)) {
    recipients = phones.filter(Boolean).map((p) => ({ phone: p, vars: { telefon: p } }));
  }

  if (!recipients.length) {
    return res.status(400).json({ success: false, message: "Göndəriləcək nömrə tapılmadı" });
  }

  try {
    const state = await WhatsAppQueue.start({
      recipients,
      template,
      source: leadStatus ? "lead" : "bulk",
      sentBy: req.user?._id,
      skipDuplicates,
    });
    await logAction(req, {
      action: "settings", resource: "whatsapp",
      summary: `WhatsApp toplu göndəriş başladı: ${state.total} nömrə`,
    });
    res.json({ success: true, message: `Toplu göndəriş başladı — ${state.total} nömrə`, data: state });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** POST /api/admin/whatsapp/bulk/cancel */
const cancelBulk = asyncHandler(async (req, res) => {
  const ok = WhatsAppQueue.cancel();
  if (ok) await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp toplu göndəriş dayandırıldı" });
  res.json({ success: true, message: ok ? "Dayandırılır…" : "İşləyən göndəriş yoxdur" });
});

/** GET /api/admin/whatsapp/messages?page=&limit=&status=&phone= — göndəriş tarixçəsi */
const listMessages = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.phone) filter.phone = new RegExp(WhatsAppService.normalizePhone(req.query.phone));

  const [items, total] = await Promise.all([
    WhatsAppMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sentBy", "name email")
      .lean(),
    WhatsAppMessage.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

/** POST /api/admin/whatsapp/disconnect — bağla, sessiyanı SAXLA. */
const disconnect = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bağlaya bilər" });
  }
  await WhatsAppService.disconnect();
  await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp bağlandı" });
  res.json({ success: true, message: "WhatsApp bağlandı (sessiya saxlanıldı)" });
});

/** POST /api/admin/whatsapp/logout — cihazı ayır + sessiyanı sil (yeni QR tələb olunur). */
const logout = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Yalnız admin bu əməliyyatı edə bilər" });
  }
  await WhatsAppService.clearSession();
  await logAction(req, { action: "settings", resource: "whatsapp", summary: "WhatsApp sessiyası silindi" });
  res.json({ success: true, message: "Sessiya silindi — yenidən QR skan etmək lazımdır" });
});

export {
  getStatus, init, checkNumber, send, sendMedia,
  bulk, cancelBulk, listMessages, disconnect, logout,
};
