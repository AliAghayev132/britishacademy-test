// Models
import { Course, Destination } from "#models";
// Data
import { COURSE_PAGES } from "../data/pageContent/courses.mjs";
import { DESTINATION_PAGES } from "../data/pageContent/destinations.mjs";

/**
 * Kurs və ölkə SƏHİFƏLƏRİNİN məzmununun importu.
 *
 * ── NİYƏ AYRICA SERVİS ──
 * Canlı saytın auditində 27 kurs səhifəsindən 21-nin, 12 ölkə səhifəsinin
 * isə HAMISININ mətni yox idi. Mövcud `importCourseData` bu işə yaramır:
 *   • göstərilən sahələri ŞƏRTSİZ üstündən yazır — admin-in paneldə etdiyi
 *     redaktə itərdi;
 *   • qiymət matrisinə də toxunur;
 *   • ölkələri ümumiyyətlə əhatə etmir.
 *
 * ── DAVRANIŞ ──
 * Hər sahə AYRICA yoxlanılır və YALNIZ BOŞDURSA doldurulur. Yəni:
 *   • admin kursun mətnini yazıbsa — mətnə toxunulmur, amma boş FAQ-ı
 *     doldurulur;
 *   • FAQ artıq varsa (bir sıra kursda var) — saxlanılır.
 * `overwrite: true` verilsə hər şey başlanğıc mətnlə əvəz olunur.
 *
 * Qiymət, dərs qrafiki, müəllim, şəkil, sıra və aktivliyə TOXUNULMUR.
 * İDEMPOTENTDİR: ikinci işə salma heç nə dəyişmir.
 */

/** Çoxdilli və ya sadə dəyər boşdurmu? HTML teqləri sayılmır. */
export const isEmptyText = (v) => {
  const raw = v && typeof v === "object" && !Array.isArray(v) ? v.az || v.en || v.ru || "" : v || "";
  return !String(raw).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
};

const isEmptyList = (v) => !Array.isArray(v) || v.length === 0;

/**
 * Hər model üçün hansı data açarı hansı sənəd sahəsinə düşür.
 * `empty` — sahənin boş sayılma qaydası.
 */
const FIELDS = {
  course: [
    ["lead", "lead", isEmptyText],
    ["excerpt", "excerpt", isEmptyText],
    ["contentHtml", "contentHtml", isEmptyText],
    ["info", "info", isEmptyList],
    ["faq", "faq", isEmptyList],
    ["seo.metaTitle", "seo.metaTitle", isEmptyText],
    ["seo.metaDescription", "seo.metaDescription", isEmptyText],
    ["seo.keywords", "seo.keywords", isEmptyText],
  ],
  destination: [
    ["lead", "lead", isEmptyText],
    ["contentHtml", "contentHtml", isEmptyText],
    ["facts", "facts", isEmptyList],
    ["faq", "faq", isEmptyList],
    ["seo.metaTitle", "seo.metaTitle", isEmptyText],
    ["seo.metaDescription", "seo.metaDescription", isEmptyText],
    ["seo.keywords", "seo.keywords", isEmptyText],
  ],
};

/** Nöqtəli yolla data obyektindən dəyər götür ("seo.metaTitle"). */
const pick = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

async function apply(Model, kind, items, { dryRun, overwrite }) {
  const report = [];
  for (const item of items) {
    const doc = await Model.findOne({ slug: item.slug, isDeleted: false });
    if (!doc) {
      // Səssiz ötürmə olmasın — slug səhvdirsə hesabatda görünsün.
      report.push({ kind, slug: item.slug, status: "tapılmadı", fields: [] });
      continue;
    }

    const filled = [];
    for (const [src, dest, empty] of FIELDS[kind]) {
      const value = pick(item, src);
      if (value === undefined) continue;
      if (!overwrite && !empty(doc.get(dest))) continue;
      doc.set(dest, value);
      filled.push(dest);
    }

    if (filled.length && !dryRun) await doc.save(); // i18n plugin sahələri normallaşdırır
    report.push({
      kind,
      slug: item.slug,
      status: !filled.length ? "doludur — toxunulmadı" : dryRun ? "doldurulacaq" : "dolduruldu",
      fields: filled,
    });
  }
  return report;
}

export async function importPageContent({ dryRun = false, overwrite = false } = {}) {
  const opts = { dryRun, overwrite };
  const report = [
    ...(await apply(Course, "course", COURSE_PAGES, opts)),
    ...(await apply(Destination, "destination", DESTINATION_PAGES, opts)),
  ];
  const count = (s) => report.filter((r) => r.status === s).length;
  return {
    report,
    summary: {
      total: report.length,
      filled: count(dryRun ? "doldurulacaq" : "dolduruldu"),
      untouched: count("doludur — toxunulmadı"),
      missing: count("tapılmadı"),
    },
  };
}
