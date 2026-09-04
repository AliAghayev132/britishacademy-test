// Models
import { SiteSetting } from "#models";
// Utils
import { normalizeLocalized } from "#utils";

/**
 * Əlaqə məlumatlarının çoxdilli hala gətirilməsi.
 *
 * NİYƏ AYRICA MİQRASİYA:
 * `contact.address` və `contact.hours` əvvəl adi sətir idi. Onlar header-in
 * üst lentində, footer-də və «Əlaqə» səhifəsində — yəni SAYTIN HƏR
 * SƏHİFƏSİNDƏ görünür. Nəticədə /en və /ru saytlarında ziyarətçi
 * «Həftə içi 09:00–21:00 · Şənbə 10:00–16:00» yazısını azərbaycanca oxuyurdu.
 *
 * Sahələr indi çoxdillidir, amma SXEM DƏYİŞMƏSİ MÖVCUD DATANI TƏRCÜMƏ ETMİR:
 * köhnə sətir `{ az: "…", en: "", ru: "" }` olur və EN/RU boş qalır. Seed
 * bunu həll edərdi, lakin o, bütün məzmunu silib yenidən qurur — canlı saytda
 * yalnız iki sahə üçün bunu etmək olmaz.
 *
 * İDEMPOTENTDİR: təkrar işlədilə bilər. Artıq DOLU olan dilə toxunmur, yəni
 * adminin panelə əl ilə yazdığı mətn üstündən yazılmır.
 */

/** Bu miqrasiyanın toxunduğu sahələr. */
const FIELDS = ["address", "hours"];

/**
 * @param {Function} tri  AZ mətni { az, en, ru }-ya çevirən seed köməkçisi
 * @param {object} opts
 * @param {boolean} [opts.dryRun]  yalnız hesabat, baza dəyişmir
 * @param {boolean} [opts.force]   dolu dilləri də üstündən yaz
 */
export async function importContactI18n(tri, { dryRun = false, force = false } = {}) {
  const settings = await SiteSetting.get();
  const changes = [];

  for (const field of FIELDS) {
    const current = normalizeLocalized(settings.contact?.[field]);
    // AZ mətn açardır — lüğət tərcüməni ona görə tapır.
    const az = current.az?.trim();
    if (!az) {
      changes.push({ field, skipped: "AZ mətn boşdur" });
      continue;
    }

    const t = tri(az);
    const next = { ...current };
    const filled = [];
    for (const lang of ["en", "ru"]) {
      // Lüğətdə açar yoxdursa `tri` AZ mətni geri qaytarır — onu EN/RU-ya
      // yazmaq tərcümə deyil, ona görə belə dəyər ötürülür.
      if (!t[lang] || t[lang] === az) continue;
      if (current[lang]?.trim() && !force) continue;
      next[lang] = t[lang];
      filled.push(lang);
    }

    if (!filled.length) {
      changes.push({ field, skipped: "dəyişiklik yoxdur" });
      continue;
    }
    changes.push({ field, filled, value: next });
    if (!dryRun) settings.contact[field] = next;
  }

  const applied = changes.filter((c) => c.filled?.length).length;
  if (!dryRun && applied) {
    // Mixed sahə: Mongoose iç dəyişikliyi görmür, açıq işarələmək lazımdır.
    settings.markModified("contact");
    await settings.save();
  }

  return { dryRun, applied, changes };
}
