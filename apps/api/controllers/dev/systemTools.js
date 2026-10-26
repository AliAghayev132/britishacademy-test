// Services
import { seedDatabase, logAction, migrateI18n, TranslateJob, MailService } from "#services";

// Utils
import { fail, ok } from "#utils";

// Local
import { developerOnly, devTool } from "./devTool.js";

/**
 * POST /api/admin/dev/seed
 * WIPES the BA content collections and reloads the known demo data.
 * Restricted to the "developer" role (editors cannot wipe data).
 */
const runSeed = devTool({
  action: "seed",
  run: () => seedDatabase(),
  summary: () => "Mock data yükləndi (content əvəzləndi)",
  message: () => "Mock data yükləndi (mövcud content əvəzləndi)",
});

/**
 * POST /api/admin/dev/migrate-i18n
 * Köhnə string məzmun sahələrini { az, en, ru } formasına çevirir (idempotent).
 * Mövcud data itmir — mövcud dəyər AZ variantı olur.
 */
const runMigrateI18n = devTool({
  run: () => migrateI18n(),
  summary: (result) => `i18n miqrasiya: ${result.totalDocs} sənəd, ${result.totalFields} sahə çevrildi`,
  message: (result) => `Miqrasiya tamamlandı — ${result.totalDocs} sənəd, ${result.totalFields} sahə çevrildi`,
});

/**
 * POST /api/admin/dev/test-mail  { to }
 * Cari SMTP konfiqurasiyası ilə test məktubu göndərir.
 */
const runTestMail = developerOnly(async (req, res) => {
  const to = String(req.body?.to || "").trim();
  if (!to) {
    return fail(res, "Email ünvanı lazımdır", 400);
  }
  const result = await MailService.sendTest(to);
  if (!result.success) {
    return fail(res, result.error || "Göndərilmədi — SMTP konfiqurasiyasını yoxlayın", 400);
  }
  await logAction(req, { action: "settings", resource: "dev", summary: `SMTP test məktubu göndərildi: ${to}` });
  ok(res, null, `Test məktubu göndərildi: ${to}`);
});

/**
 * POST /api/admin/dev/translate-all  { langs?, model?, limit?, overwrite? }
 * Bazadakı BOŞ EN/RU sahələrini AZ mətnindən AI ilə doldurur (OpenRouter).
 * Mövcud tərcüməyə toxunmur — təkrar işlədilə bilər.
 */
/**
 * Toplu tərcüməni BAŞLADIR və dərhal qayıdır.
 *
 * Əvvəl işin bitməsi gözlənilirdi, sorğu isə Cloudflare-in 100 saniyə
 * limitinə ilişirdi: panel xəta görür, iş arxada davam edirdi — kənardan
 * «yarıda saxlayır» kimi. İndi gedişat /translate-all/status ilə oxunur.
 */
const runAutoTranslate = developerOnly(async (req, res) => {
  const { langs, model, limit, overwrite } = req.body || {};
  const { started, state } = TranslateJob.start({
    langs: Array.isArray(langs) && langs.length ? langs : ["en", "ru"],
    model: model || undefined,
    limit: Number(limit) || 500,
    overwrite: Boolean(overwrite),
  });

  if (!started) return ok(res, state, "Tərcümə artıq işləyir");

  await logAction(req, {
    action: "settings",
    resource: "dev",
    summary: "AI toplu tərcümə başladıldı",
  });
  ok(res, state, "Tərcümə başladı — gedişat aşağıda göstərilir");
});

/** GET /api/admin/dev/translate-all/status — arxa fon işinin vəziyyəti. */
const getAutoTranslateStatus = developerOnly(async (_req, res) => {
  ok(res, TranslateJob.getState());
});

export { runSeed, runMigrateI18n, runTestMail, runAutoTranslate, getAutoTranslateStatus };
