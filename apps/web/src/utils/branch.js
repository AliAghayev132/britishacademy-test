// ── Filial mətnlərinin göstərilməsi ──
//
// NİYƏ AYRICA MODUL: filial ünvanı və metrosu ÜÇ yerdə göstərilir (əlaqə
// səhifəsi, filiallar səhifəsi, kurs qiymət kartları). Formatlaşdırma hər
// birində ayrıca yazılmışdı və nəticələr bir-birindən fərqlənirdi.
//
// Həll etdiyi iki konkret nasazlıq:
//
//  1. TƏKRARLANAN YER ADI. Ünvan sahəsinə rayon SÖZSÜZ əlavə olunurdu:
//     «Əhmədli, Babək pr. 88» + rayon «Əhmədli» → «Əhmədli, Babək pr. 88,
//     Əhmədli». Kartda metro da «Əhmədli» olduğuna görə söz ÜÇ dəfə görünürdü.
//
//  2. METRO SUFFİKSİ. Üç filialda «Nizami m.», «Nərimanov m.» yazılıb,
//     birində isə sadəcə «Əhmədli». Sonuncu ünvanın davamı kimi oxunurdu —
//     onun metro adı olduğu bilinmirdi. Suffiksi admindən tələb etmək əvəzinə
//     göstərilən anda tamamlanır.

/**
 * Müqayisə üçün normallaşdırma: böyük/kiçik hərf və Azərbaycan diakritikləri
 * nəzərə alınmır. «Əhmədli» ilə «əhmədli» eyni sayılmalıdır.
 *
 * ə və ı Unicode-da parçalanmır (NFD onlara toxunmur), ona görə açıq şəkildə
 * əvəzlənir.
 */
const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ə/g, "e");

/** Dil üzrə metro affiksi: mövcudluq yoxlaması + tamamlama. */
const METRO_AFFIX = {
  az: { has: /(\bm\.|metro)/i, wrap: (v) => `${v} m.` },
  en: { has: /(metro|station)/i, wrap: (v) => `${v} metro` },
  ru: { has: /((^|\s)м\.|метро)/i, wrap: (v) => `м. ${v}` },
};

/**
 * Metro adını tam etiketə çevir.
 *   «Əhmədli»      → «Əhmədli m.»
 *   «Nizami m.»    → «Nizami m.»      (artıq var, toxunulmur)
 *   «Ahmadli»      → «Ahmadli metro»  (en)
 *   «Ахмедлы»      → «м. Ахмедлы»     (ru)
 */
export function metroLabel(metro, locale = "az") {
  const v = String(metro ?? "").trim();
  if (!v) return "";
  const a = METRO_AFFIX[locale] || METRO_AFFIX.az;
  return a.has.test(v) ? v : a.wrap(v);
}

/**
 * Rayon ünvana ƏLAVƏ MƏLUMAT verirmi?
 *
 * «Azaro Plaza, 3-cü mərtəbə» + «Nərimanov» → bəli, ünvan tək başına yeri
 * göstərmir. «Əhmədli, Babək pr. 88» + «Əhmədli» → xeyr, artıq oradadır.
 */
export function districtAdds(address, district) {
  const d = String(district ?? "").trim();
  if (!d) return false;
  return !fold(address).includes(fold(d));
}

/** Ünvan sətri — rayon yalnız yeni məlumat verirsə əlavə olunur. */
export function addressLine(address, district) {
  const a = String(address ?? "").trim();
  if (!districtAdds(a, district)) return a;
  return a ? `${a}, ${String(district).trim()}` : String(district).trim();
}
