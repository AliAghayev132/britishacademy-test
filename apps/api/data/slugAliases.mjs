/**
 * Kurs slug-larının köhnə → yeni xəritəsi.
 *
 * Köhnə statik saytda kurs ünvanları CƏM formada idi (/ingilis-dili-kurslari)
 * və məhz o formalar axtarış nəticələrində indekslənib. Yeni sluglar həmin
 * ünvanlarla eyniləşdirildi.
 *
 * Bu fayl ÜÇ yerdən oxunur və vahid həqiqət mənbəyidir:
 *   1) SlugMigrationService — bazadakı sənədləri yenidən adlandırır
 *   2) publicController     — miqrasiya işlədilməyibsə yeni slug-u köhnəyə
 *                             çevirib tapır (aşağıdakı izaha bax)
 *   3) apps/web legacyRoutes — köhnə ünvanları yeniyə yönləndirir
 *
 * NİYƏ KONTROLLERDƏ DƏ LAZIMDIR:
 * Yönləndirmə kodla, slug dəyişikliyi isə baza ilə gəlir. Kod deploy olunub
 * miqrasiya hələ işlədilməyəndə /kurslar/ingilis-dili-kursu → 301 →
 * /kurslar/ingilis-dili-kurslari → 404 zənciri yaranırdı: yönləndirmə hələ
 * mövcud olmayan slug-a işarə edirdi və üç ən çox baxılan kurs tamamilə
 * əlçatmaz olurdu. Kontrollerdəki ehtiyat axtarış bu asılılığı aradan
 * qaldırır — sayt miqrasiyadan ƏVVƏL də, SONRA da işləyir.
 */

/** Köhnə slug → yeni slug. */
export const SLUG_RENAMES = {
  "ingilis-dili-kursu": "ingilis-dili-kurslari",
  ielts: "ielts-kurslari",
  sat: "sat-kurslari",
};

/** Yeni slug → köhnə slug (əks indeks — ehtiyat axtarış üçün). */
export const LEGACY_SLUG_OF = Object.freeze(
  Object.fromEntries(
    Object.entries(SLUG_RENAMES).map(([from, to]) => [to, from]),
  ),
);
