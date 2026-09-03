/**
 * ObjectId formasının yoxlanması.
 *
 * NİYƏ AYRICA KÖMƏKÇİ, hər yerdə reqeks yox:
 * Eyni naxış üç yerə köçürülmüşdü (müraciətdə ölkələr, müraciətdə layihə,
 * istifadəçi icazələri) və hər üçündə `\d` təsadüfən `d`-yə çevrilmişdi:
 *
 *   /^[a-fd]{24}$/i     ← RƏQƏM QƏBUL ETMİR
 *
 * Nəticədə hər üç sahə SƏSSİZCƏ boş saxlanılırdı: forma «göndərildi» deyirdi,
 * ölkə seçimi isə bazaya düşmürdü; istifadəçiyə verilən ölkə/filial icazələri
 * də yazılmırdı. Səhv heç bir xəta vermirdi — yalnız məlumat itirdi.
 *
 * İndi bir yerdədir və testlə örtülüb.
 */

/** 24 simvollu hex sətir? */
export const isObjectId = (v) => /^[0-9a-f]{24}$/i.test(String(v ?? ""));

/**
 * Massivdən yalnız etibarlı ObjectId-ləri süz.
 *
 * @param {unknown} v      gələn dəyər (massiv olmaya bilər)
 * @param {number} [max]   maksimum element — açıq endpointlərdə həddi saxlayır
 */
export const cleanIds = (v, max = 50) =>
  Array.isArray(v) ? v.filter(isObjectId).slice(0, max) : [];
