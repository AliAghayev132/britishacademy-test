// Toplu göndəriş — WhatsApp və e-poçt, üç mənbədən:
//   leads  → müraciətlər (status üzrə süzülür)
//   excel  → admin brauzerdə parse edib göndərir (server fayl qəbul etmir)
//   list   → əl ilə sətir-sətir yazılan siyahı
// Marşrutlar /api/admin/bulk/* altındadır (router səviyyəsində auth).

// Models
import { Lead } from "#models";

// Services
import {
  BulkQueue,
  normalizeRecipients,
  logAction,
  resolveDelaySec,
  DELAY_LIMITS,
} from "#services";

// Utils
import { fail, ok, asyncHandler, hasRole, canAccessSection } from "#utils";

// Local
import { applyLeadAccess, applyLeadScope } from "./adminController.js";

/** Müraciətlərdən alıcı siyahısı qur. */
async function fromLeads({ leadStatus, channel }, req) {
  const filter = { isDeleted: false };
  if (leadStatus && leadStatus !== "all") filter.status = leadStatus;
  // Müraciətlər siyahısı ilə EYNİ sərhəd: bölmə və filial/ölkə əhatəsi.
  // Əvvəl yalnız WhatsApp bölməsi olan adam hamının telefonunu görürdü.
  applyLeadAccess(filter, req, "leads");
  applyLeadScope(filter, req, "leads");

  const leads = await Lead.find(filter).select("name phone email").limit(2000).lean();
  return leads.map((l) => ({
    name: l.name,
    phone: l.phone,
    email: l.email,
    lead: l._id,
    // Kanal üzrə lazımi sahə yoxdursa normalizeRecipients onu «etibarsız»
    // kimi qaytaracaq — səssiz itmir.
    value: channel === "email" ? l.email : l.phone,
  }));
}

/**
 * Alıcı siyahısını mənbəyə görə hazırla və doğrula.
 * Həm önizləmə, həm göndəriş eyni funksiyadan keçir — nəticə fərqli olmasın.
 */
async function buildRecipients(body, req) {
  const { channel = "whatsapp", source = "leads", leadStatus, recipients = [] } = body || {};
  // Müraciət bölməsi olmayan adam müraciətlərdən siyahı qura bilməz.
  const canUseLeads = canAccessSection(req.user, "leads") || canAccessSection(req.user, "leads-abroad");
  const rows = source === "leads" ? (canUseLeads ? await fromLeads({ leadStatus, channel }, req) : []) : recipients;
  return { channel, source, ...normalizeRecipients(rows, channel) };
}

/**
 * POST /api/admin/bulk/preview
 * Göndərmədən ÖNCƏ nəyin gedəcəyini göstərir: etibarlı/etibarsız sayı,
 * təkrarlar və ilk 10 alıcı. İki mərhələli təsdiqin birinci addımıdır.
 */
const preview = asyncHandler(async (req, res) => {
  const { channel, source, valid, invalid, duplicates } = await buildRecipients(req.body, req);
  // Fasilə burada da həll olunur ki, təsdiq dialoqu göndərişin NƏ QƏDƏR
  // çəkəcəyini göstərə bilsin: 500 alıcı × 6 saniyə = 50 dəqiqə. Admin bunu
  // başlamazdan ƏVVƏL bilməlidir.
  const delaySec = resolveDelaySec(channel, req.body?.delaySec);
  ok(res, {
    channel,
    source,
    total: valid.length,
    delaySec,
    etaSec: Math.max(0, valid.length - 1) * delaySec,
    duplicates,
    invalid: invalid.slice(0, 50),
    invalidCount: invalid.length,
    sample: valid.slice(0, 10).map((r) => ({
      name: r.name || "",
      to: channel === "email" ? r.email : r.phone,
    })),
  });
});

/**
 * POST /api/admin/bulk/send
 * body: { channel, source, leadStatus?, recipients?, template, subject?,
 *         skipDuplicates?, confirm }
 *
 * `confirm` mütləqdir — UI iki dəfə təsdiq alır, server isə üçüncü qapıdır:
 * təsadüfi/təkrar POST sorğusu minlərlə mesaj göndərməsin.
 */
const send = asyncHandler(async (req, res) => {
  if (!hasRole(req.user, "admin")) {
    return fail(res, "Toplu göndərişi yalnız admin başlada bilər", 403);
  }

  const { template, subject, skipDuplicates = true, confirm, delaySec } = req.body || {};
  if (confirm !== true) {
    return fail(res, "Təsdiq olunmayıb", 400);
  }
  if (!template?.trim()) {
    return fail(res, "Mesaj mətni məcburidir", 400);
  }

  const { channel, source, valid, invalid } = await buildRecipients(req.body, req);
  if (!valid.length) {
    return fail(res, invalid.length
      ? `Etibarlı alıcı yoxdur (${invalid.length} sətir yanlışdır)`
      : "Göndəriləcək alıcı tapılmadı", 400);
  }

  try {
    const state = await BulkQueue.start({
      channel,
      recipients: valid,
      template,
      subject,
      source,
      sentBy: req.user?._id,
      skipDuplicates,
      delaySec,
    });
    await logAction(req, {
      action: "settings",
      resource: "bulk",
      summary: `Toplu göndəriş (${channel}/${source}): ${state.total} alıcı, ${state.delaySec} san fasilə`,
    });
    ok(res, { ...state, skipped: invalid.length }, `Toplu göndəriş başladı — ${state.total} alıcı, ${state.delaySec} san fasilə`);
  } catch (err) {
    fail(res, err.message, 400);
  }
});

/** GET /api/admin/bulk/status */
const status = asyncHandler(async (_req, res) => {
  // Həddlər cavabla birlikdə gedir — panel slayderin sərhədlərini serverdən
  // öyrənir, əks halda iki yerdə saxlanılıb bir-birindən ayrı düşərdi.
  ok(res, { ...BulkQueue.getState(), limits: DELAY_LIMITS });
});

/** POST /api/admin/bulk/cancel */
const cancel = asyncHandler(async (req, res) => {
  // Ad `ok` deyil: #utils-dəki ok() köməkçisini kölgələyərdi.
  const cancelled = BulkQueue.cancel();
  if (cancelled) {
    await logAction(req, { action: "settings", resource: "bulk", summary: "Toplu göndəriş dayandırıldı" });
  }
  ok(res, null, cancelled ? "Dayandırılır…" : "İşləyən göndəriş yoxdur");
});

export { preview, send, status, cancel };
