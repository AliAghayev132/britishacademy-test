// Models
import { MenuItem } from "#models";

/**
 * Başlıq menyusunun yenidən qurulması.
 *
 * NİYƏ AYRICA SERVİS:
 * Menyu quruluşu dəyişdi — «Haqqımızda» artıq uşaq bəndləri saxlayır
 * (Müəllimlər, Tələbələrimiz). Yeni quruluş seed faylındadır, lakin seed
 * BÜTÜN məzmunu silib yenidən qurur; canlı saytda yalnız menyu dəyişikliyi
 * üçün bunu etmək olmaz.
 *
 * Bu servis YALNIZ `location: "header"` bəndlərinə toxunur — kurslar,
 * müəllimlər, müraciətlər və qalan hər şey yerində qalır.
 *
 * İDEMPOTENTDİR: təkrar işlədilə bilər, nəticə həmişə eynidir.
 */

/**
 * @param {Array} headerMenu  seed-dəki HEADER_MENU (uşaqlarla)
 * @param {Function} tri      AZ mətni { az, en, ru }-ya çevirən funksiya
 * @param {object} opts
 * @param {boolean} [opts.dryRun]  yalnız hesabat, baza dəyişmir
 */
export async function importHeaderMenu(headerMenu, tri, { dryRun = false } = {}) {
  const before = await MenuItem.countDocuments({ location: "header" });

  const planned = [];
  for (const [i, m] of headerMenu.entries()) {
    planned.push({ label: m.label, href: m.href, type: m.type, level: 0, order: i });
    for (const [ci, c] of (m.children || []).entries()) {
      planned.push({ label: c.label, href: c.href, type: c.type, level: 1, order: ci });
    }
  }

  if (dryRun) {
    return { dryRun: true, before, after: planned.length, items: planned };
  }

  // Footer və mobil menyulara TOXUNULMUR — yalnız başlıq.
  await MenuItem.deleteMany({ location: "header" });

  const created = [];
  for (const [i, m] of headerMenu.entries()) {
    const { children, ...rest } = m;
    const parent = await MenuItem.create({
      ...rest,
      label: tri(m.label),
      location: "header",
      order: i,
    });
    created.push(parent);
    for (const [ci, c] of (children || []).entries()) {
      created.push(
        await MenuItem.create({
          ...c,
          label: tri(c.label),
          location: "header",
          parent: parent._id,
          order: ci,
        }),
      );
    }
  }

  return { dryRun: false, before, after: created.length, items: planned };
}
