// Services
import {
  importQuizzes,
  importBlog,
  importPageContent,
  importHeaderMenu,
  importContactI18n,
  HEADER_MENU,
} from "#services";

// Data
import { tri } from "#data";

// Local
import { devTool, dryRunOption } from "./devTool.js";

/**
 * POST /api/admin/dev/import-quizzes
 *
 * İngilis və Rus dili səviyyə testlərini yükləyir. Mövcud test
 * TOXUNULMUR (admin sualları redaktə etmiş ola bilər) — üzərinə yazmaq
 * üçün `overwrite: true` göndərilir.
 */
const runImportQuizzes = devTool({
  options: (req) => ({ dryRun: Boolean(req.body?.dryRun), overwrite: Boolean(req.body?.overwrite) }),
  run: ({ dryRun, overwrite }) => importQuizzes({ dryRun, overwrite }),
  summary: (result, { dryRun }) => !dryRun && `Testlər: ${result.created} yaradıldı, ${result.replaced} əvəz olundu`,
  message: (result) => `${result.created} yaradıldı, ${result.replaced} əvəz olundu, ${result.skipped} toxunulmadı`,
});

/**
 * POST /api/admin/dev/import-blog
 *
 * SEO bloq yazılarını yükləyir. Auditdə çıxan boşluğu doldurmaq üçündür:
 * saytda 0 bloq yazısı var idi və kurs/ölkə səhifələrinin böyük hissəsi
 * mətnsiz idi, yəni axtarış sistemləri üçün göstəriləcək məzmun yox idi.
 *
 * Yazılar QARALAMA kimi yüklənir — mətn yoxlanmadan saytda dərc olunmur.
 * `publish: true` verilsə dərhal dərc edilir.
 */
const runImportBlog = devTool({
  options: (req) => ({
    dryRun: Boolean(req.body?.dryRun),
    overwrite: Boolean(req.body?.overwrite),
    publish: Boolean(req.body?.publish),
  }),
  run: async ({ dryRun, overwrite, publish }) => {
    const { report, summary } = await importBlog({ dryRun, overwrite, publish });
    return { report, summary };
  },
  summary: ({ summary }, { dryRun }) =>
    !dryRun && `Bloq: ${summary.created} yazı yaradıldı, ${summary.published} dərc olundu, ${summary.replaced} əvəz olundu`,
  message: ({ summary }) =>
    `${summary.created} yaradıldı, ${summary.published} dərc olundu, ${summary.replaced} əvəz olundu, ${summary.skipped} toxunulmadı`,
});

/**
 * POST /api/admin/dev/import-menu
 *
 * Başlıq menyusunu yenidən qurur. Menyu quruluşu dəyişəndə tam seed
 * işlətməmək üçündür: bu əməliyyat YALNIZ header menyusuna toxunur, kurslar,
 * müəllimlər və müraciətlər yerində qalır.
 */
const runImportMenu = devTool({
  options: dryRunOption,
  run: ({ dryRun }) => importHeaderMenu(HEADER_MENU, tri, { dryRun }),
  summary: (result, { dryRun }) => !dryRun && `Menyu yeniləndi: ${result.before} → ${result.after} bənd`,
  message: (result, { dryRun }) =>
    dryRun
      ? `${result.after} bənd quraşdırılacaq (sınaq rejimi)`
      : `Menyu yeniləndi — ${result.after} bənd`,
});

/**
 * POST /api/admin/dev/import-contact
 * «Əlaqə» tənzimləmələrindəki ünvan və iş saatlarını 3 dilə tamamlayır.
 * Sahələr sonradan çoxdilli edildi; canlı bazadakı köhnə sətirlər isə yalnız
 * AZ qalmışdı və hər səhifədə (üst lent, footer) azərbaycanca görünürdü.
 */
const runImportContact = devTool({
  options: (req) => ({ dryRun: Boolean(req.body?.dryRun), force: Boolean(req.body?.force) }),
  run: ({ dryRun, force }) => importContactI18n(tri, { dryRun, force }),
  summary: (result, { dryRun }) => !dryRun && result.applied && `Əlaqə tərcümələri yeniləndi: ${result.applied} sahə`,
  message: (result, { dryRun }) =>
    result.applied
      ? `${result.applied} sahə 3 dilə tamamlandı${dryRun ? " (sınaq rejimi)" : ""}`
      : "Dəyişiklik lazım deyil — hər şey artıq tərcümə olunub",
});

/**
 * POST /api/admin/dev/import-page-content
 *
 * Kurs və ölkə SƏHİFƏLƏRİNİN mətnini, FAQ-ını, qısa məlumatını və SEO-sunu
 * doldurur. Hər sahə ayrıca yoxlanılır və YALNIZ BOŞDURSA yazılır — admin
 * paneldə yazılmış mətn qorunur. `overwrite: true` hər şeyi əvəz edir.
 */
const runImportPageContent = devTool({
  options: (req) => ({ dryRun: Boolean(req.body?.dryRun), overwrite: Boolean(req.body?.overwrite) }),
  run: async ({ dryRun, overwrite }) => {
    const { report, summary } = await importPageContent({ dryRun, overwrite });
    return { report, summary };
  },
  summary: ({ summary }, { dryRun, overwrite }) =>
    !dryRun && `Səhifə məzmunu: ${summary.filled} səhifə dolduruldu${overwrite ? " (üzərinə yazılaraq)" : ""}`,
  message: ({ summary }, { dryRun }) =>
    `${summary.filled} səhifə ${dryRun ? "doldurulacaq" : "dolduruldu"}, ${summary.untouched} artıq dolu idi${summary.missing ? `, ${summary.missing} tapılmadı` : ""}`,
});

export { runImportQuizzes, runImportBlog, runImportMenu, runImportContact, runImportPageContent };
