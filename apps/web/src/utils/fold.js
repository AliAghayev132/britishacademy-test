/**
 * Müqayisə üçün normallaşdırma: böyük/kiçik hərf və Azərbaycan diakritikləri
 * nəzərə alınmır. «Əhmədli» ilə «ehmedli» eyni sayılmalıdır.
 *
 * NİYƏ ORTAQ FAYLDA: eyni məntiq həm filial ünvanlarında, həm də admin
 * panelin naviqasiya axtarışında lazımdır. Klaviaturasında «ə» olmayan
 * (və ya sadəcə tələsən) istifadəçi «tenzimleme» yazır — nəticə çıxmalıdır.
 *
 * `ə` və `ı` Unicode-da parçalanmır (NFD onlara toxunmur), ona görə açıq
 * şəkildə əvəzlənir. Qalan hərflər (ş ç ğ ö ü) NFD ilə ayrılıb aksent
 * silinməklə həll olunur.
 */
export const fold = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ə/g, "e");
