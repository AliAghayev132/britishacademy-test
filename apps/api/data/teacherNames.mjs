/**
 * Müəllim adlarının rus dilində yazılışı.
 *
 * NİYƏ TƏRCÜMƏ DEYİL, TRANSLİTERASİYA:
 * Ad tərcümə olunmur — sadəcə başqa əlifba ilə yazılır. İngilis dilində
 * azərbaycanca latın yazılışı OLDUĞU KİMİ qalır (beynəlxalq praktikada şəxs
 * adları belə saxlanılır); yalnız rus dili üçün kiril forması verilir.
 *
 * ⚠️ YOXLANILMALIDIR: burada Azərbaycan adlarının rus dilində qəbul olunmuş
 * ənənəvi formaları işlədilib (Əhmədova → Ахмедова, Quliyev → Кулиев). Lakin
 * insan öz adını sənədlərdə fərqli yaza bilər. Müəllimlərin pasport/sənəd
 * yazılışı ilə tutuşdurulmalıdır — səhv yazılmış ad tərcüməsiz addan pisdir.
 *
 * Yeni müəllim əlavə olunanda buraya da qeyd yazılmalıdır; qeyd yoxdursa ad
 * hər üç dildə latın yazılışında qalır (sayt sınmır).
 */

export const TEACHER_NAMES_RU = {
  "Şirinnaz Kərimova": "Ширинназ Керимова",
  "Xədicə Əsədzadə": "Хадиджа Асадзаде",
  "Jasmin Vəlixanova": "Жасмин Велиханова",
  "Aytac İsmaylova": "Айтадж Исмайлова",
  "Gözəl Məhərrəmova": "Гёзель Магеррамова",
  "Ülkər İsmayılzadə": "Улькер Исмаилзаде",
  "Səkinə Məmmədova": "Сакина Мамедова",
  "Mahirə Əzizova": "Махира Азизова",
  "Səbinə Əliyeva": "Сабина Алиева",
  "Esmira Rzayeva": "Эсмира Рзаева",
  "Türkan Bəşirova": "Тюркан Баширова",
  "Gülnar Əliyeva": "Гюльнар Алиева",
  "Günel Yaşar": "Гюнель Яшар",
  "Ülviyyə Mehdizadə": "Ульвия Мехдизаде",
  "Müşəfərim Bürcalıyeva": "Мушафарим Бюрджалиева",
  "Fidan Qurbanova": "Фидан Гурбанова",
  "Səbinə Rufullayeva": "Сабина Руфуллаева",
  "Banu Allahverdiyeva": "Бану Аллахвердиева",
  "Nəzrin Məstiyeva": "Назрин Мастиева",
  "Nərgiz Yusifli": "Наргиз Юсифли",
  "Vidadi Oruczadə": "Видади Оруджзаде",
  "Aytac Qurbanova": "Айтадж Гурбанова",
  "Ramiz Səmədov": "Рамиз Самедов",
  "Gülnar Xəlilzadə": "Гюльнар Халилзаде",
  "Renat İmamov": "Ренат Имамов",
  "Nigar Əhmədova": "Нигяр Ахмедова",
  "Safura Kərimova": "Сафура Керимова",
  "Sabrina Kazımzadə": "Сабрина Казымзаде",
  "Aysu İbrahimli": "Айсу Ибрагимли",
  "Fidan İbrahimli": "Фидан Ибрагимли",
  "Vanilla Abdoun": "Ванилла Абдун",
  "Məryəm Əhmədova": "Марьям Ахмедова",
  "Rəşad Quliyev": "Рашад Кулиев",
  "Həvva Əlizadə": "Хавва Ализаде",
  "Aytac Soltanova": "Айтадж Солтанова",
  "Bahar Baxışlı": "Бахар Бахышлы",
  "Günay Kərimova": "Гюнай Керимова",
  "Aysel Ağarzayeva": "Айсель Агарзаева",
  "Zöhrə Əhmədova": "Зохра Ахмедова",
};

/**
 * Adı { az, en, ru } formasına gətir.
 *
 * EN həmişə orijinal latın yazılışıdır. RU qeyd varsa kiril, yoxdursa yenə
 * latın — belə halda sayt işləməyə davam edir, sadəcə ad tərcümə olunmamış
 * görünür.
 */
export const triName = (name) => ({
  az: name,
  en: name,
  ru: TEACHER_NAMES_RU[name] || name,
});
