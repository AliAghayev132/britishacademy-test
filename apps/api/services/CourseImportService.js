// Models
import { Course, Branch } from "#models";

// Data
import { COURSE_IMPORT } from "../data/courseImport.mjs";

/**
 * Müştəridən gələn kurs məlumatlarını (3 dildə mətn, SEO, filial qiymətləri)
 * mövcud kurslara tətbiq edir.
 *
 * İdempotentdir — təkrar işlədilə bilər. Kurs və ya filial tapılmasa həmin
 * sətir ötürülür və hesabatda göstərilir (səssiz uğursuzluq olmasın).
 *
 * Yalnız `data/courseImport.mjs`-də göstərilən sahələr yazılır; kursun
 * qalan sahələrinə (şəkil, sıra, aktivlik, dərs qrafiki) toxunulmur.
 */
export async function importCourseData({ dryRun = false } = {}) {
  // Filial slug → _id xəritəsi (hər kurs üçün təkrar sorğu getməsin)
  const branches = await Branch.find({}).select("slug name").lean();
  const branchId = new Map(branches.map((b) => [b.slug, b._id]));

  const report = [];
  let updated = 0;
  const warnings = [];

  for (const item of COURSE_IMPORT) {
    const course = await Course.findOne({ slug: item.slug });
    if (!course) {
      warnings.push(`Kurs tapılmadı: ${item.slug}`);
      report.push({ slug: item.slug, status: "kurs tapılmadı" });
      continue;
    }

    // ── Mətn sahələri (3 dilli) ──
    if (item.lead) course.lead = item.lead;
    if (item.excerpt) course.excerpt = item.excerpt;
    if (item.contentHtml) course.contentHtml = item.contentHtml;

    // ── "Qısa məlumat" kartı ──
    if (item.info?.length) course.info = item.info;

    // ── SEO ──
    if (item.seo) {
      course.seo = {
        ...(course.seo?.toObject?.() || course.seo || {}),
        metaTitle: item.seo.metaTitle,
        metaDescription: item.seo.metaDescription,
        keywords: item.seo.keywords,
      };
    }

    // ── Filial üzrə qiymət matrisi ──
    let priceRows = 0;
    if (item.pricing?.length) {
      const rows = [];
      for (const p of item.pricing) {
        const id = branchId.get(p.branch);
        if (!id) {
          warnings.push(`${item.slug}: filial tapılmadı — ${p.branch}`);
          continue;
        }
        rows.push({
          branch: id,
          group: p.group,
          individual: p.individual,
          note: p.note,
        });
      }
      if (rows.length) {
        course.pricing = rows;
        course.pricingMode = "branch";
        priceRows = rows.length;
      }
    }

    if (!dryRun) await course.save(); // i18n plugin sahələri normallaşdırır
    updated += 1;
    report.push({
      slug: item.slug,
      status: dryRun ? "yoxlanıldı" : "yeniləndi",
      fields: ["lead", "excerpt", "contentHtml", "info", "seo"].filter((f) => item[f] || (f === "seo" && item.seo)).length,
      priceRows,
    });
  }

  return { updated, total: COURSE_IMPORT.length, report, warnings, dryRun };
}
