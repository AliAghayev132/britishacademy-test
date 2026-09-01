// Models
import { Course } from "#models";
// Data
import { SLUG_RENAMES } from "../data/slugAliases.mjs";

/**
 * Kurs slug-larının köhnə saytın ünvanlarına uyğunlaşdırılması.
 *
 * NİYƏ LAZIMDIR:
 * Köhnə statik saytda kurs səhifələri kökdə idi və ünvanlar CƏM formada:
 * /ingilis-dili-kurslari, /ielts-kurslari, /sat-kurslari. Analitikaya görə
 * yalnız bu üç səhifə ayda 1300-dən çox giriş alırdı. Yeni saytda sluglar
 * TƏK formada idi (ingilis-dili-kursu, ielts, sat).
 *
 * Seed faylı artıq yeni sluglarla gəlir, LAKİN seed bütün məzmunu silib
 * yenidən qurur — canlı saytda onu işlətmək olmaz. Bu servis yalnız `slug`
 * sahəsini yeniləyir, kursun qalan məlumatına (mətn, qiymət, şəkil,
 * baxış sayğacı) TOXUNMUR.
 *
 * Miqrasiya olmadan proxy-dəki yönləndirmə (/kurslar/ielts → /kurslar/
 * ielts-kurslari) bazada olmayan slug-a düşərdi və 404 verərdi.
 *
 * İDEMPOTENTDİR — təkrar işlədilə bilər, ikinci dəfə heç nə dəyişmir.
 */

// Xəritə ortaq data faylındadır — publicController-dəki ehtiyat axtarış da
// eyni mənbədən oxuyur ki, iki yerdə ayrılmasınlar.
export { SLUG_RENAMES } from "../data/slugAliases.mjs";

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun] yalnız hesabat, baza dəyişmir
 */
export async function migrateCourseSlugs({ dryRun = false } = {}) {
  const changes = [];
  const skipped = [];

  for (const [from, to] of Object.entries(SLUG_RENAMES)) {
    // Silinmişlər də daxil — arxivdəki kurs sonradan bərpa olunsa
    // slug toqquşması yaratmasın.
    const doc = await Course.findOne({ slug: from });

    if (!doc) {
      // Artıq köçürülüb (normal hal) yoxsa kurs heç yoxdur — fərqi göstəririk.
      const already = await Course.findOne({ slug: to });
      skipped.push({ from, to, reason: already ? "artıq köçürülüb" : "kurs tapılmadı" });
      continue;
    }

    // Hədəf slug başqa kursda işlənirsə üzərinə yazmırıq — unikal indeks
    // səhv verərdi və hansı kursun düzgün olduğu bizə məlum deyil.
    const clash = await Course.findOne({ slug: to, _id: { $ne: doc._id } });
    if (clash) {
      skipped.push({ from, to, reason: "hədəf slug başqa kursda işlənir" });
      continue;
    }

    if (!dryRun) {
      doc.slug = to;
      await doc.save();
    }
    changes.push({ from, to, id: String(doc._id) });
  }

  return {
    dryRun,
    renamed: changes.length,
    changes,
    skipped,
  };
}
