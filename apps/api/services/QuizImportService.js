// Models
import { Quiz } from "#models";
// Data
import { QUIZZES } from "../data/quizData.mjs";

/**
 * Testlərin importu.
 *
 * Seed bütün məzmunu silib yenidən qurur — canlı saytda onu işlətmək olmaz.
 * Bu servis yalnız testlərə toxunur.
 *
 * DAVRANIŞ: test slug-a görə tapılır.
 *   • yoxdursa — yaradılır
 *   • varsa    — DƏYİŞDİRİLMİR (admin sualları redaktə etmiş ola bilər;
 *                üzərinə yazmaq onun işini silmək olardı)
 * `overwrite: true` verilsə mövcud test də başlanğıc məzmunla əvəz olunur.
 *
 * İDEMPOTENTDİR.
 */
export async function importQuizzes({ dryRun = false, overwrite = false } = {}) {
  const report = [];

  for (const data of QUIZZES) {
    const existing = await Quiz.findOne({ slug: data.slug });

    // Sual sırası massivdəki yerdən götürülür — data faylında əl ilə
    // nömrələmək səhv mənbəyidir.
    const doc = {
      ...data,
      questions: data.questions.map((q, i) => ({ ...q, order: i, isActive: true })),
      isActive: true,
      isDeleted: false,
    };

    if (!existing) {
      if (!dryRun) await Quiz.create(doc);
      report.push({ slug: data.slug, status: "yaradıldı", questions: doc.questions.length });
      continue;
    }

    if (!overwrite) {
      report.push({
        slug: data.slug,
        status: "mövcuddur — toxunulmadı",
        questions: existing.questions?.length || 0,
      });
      continue;
    }

    if (!dryRun) {
      Object.assign(existing, doc);
      await existing.save();
    }
    report.push({ slug: data.slug, status: "əvəz olundu", questions: doc.questions.length });
  }

  return {
    dryRun,
    overwrite,
    created: report.filter((r) => r.status === "yaradıldı").length,
    replaced: report.filter((r) => r.status === "əvəz olundu").length,
    skipped: report.filter((r) => r.status.startsWith("mövcuddur")).length,
    items: report,
  };
}
