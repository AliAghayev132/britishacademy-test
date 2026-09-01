/**
 * Filial məlumatları — müştəridən gələn real ünvan, telefon, WhatsApp,
 * koordinat və xəritə linkləri.
 *
 * Həm seed, həm də BranchImportService bu fayldan oxuyur. Əvvəl məlumat
 * yalnız seed-in içində idi və mövcud bazaya tətbiq etmək üçün hər şeyi
 * silib yenidən yükləmək lazım gəlirdi.
 *
 * Mətn sahələri ÜÇ DİLDƏ verilir. i18nPlugin adi sətri {az,en,ru}-ya
 * çevirərkən yalnız AZ-ı doldurur — EN/RU boş qalır və sayt onlarda da
 * azərbaycanca göstərirdi.
 *
 * Koordinatlar müştərinin Google Maps linklərindəki @lat,lng dəyərləridir —
 * DÖRD filialın hamısında var. Xəritə birbaşa həmin nöqtəyə embed olunur;
 * qısa goo.gl linkləri iframe-də açılmır, ona görə tam URL saxlanılır.
 * mapUrl «Xəritədə aç» düyməsi üçündür.
 *
 * Sıra müştərinin verdiyi ardıcıllıqdır: Caspian → Elmlər → Nərimanov → Əhmədli.
 */

/** İş saatları — hər üç dildə. */
const HOURS = (from, to) => [
  { days: { az: "B.e–Şənbə", en: "Mon–Sat", ru: "Пн–Сб" }, from, to },
];

export const BRANCHES = [
  {
    name: {
      az: "Mərkəz — Caspian Plaza",
      en: "Main Office — Caspian Plaza",
      ru: "Главный офис — Caspian Plaza",
    },
    address: {
      az: "C.Cabbarlı 44, Caspian Plaza, 9-cu mərtəbə",
      en: "44 J.Jabbarli St, Caspian Plaza, 9th floor",
      ru: "ул. Дж.Джаббарлы 44, Caspian Plaza, 9-й этаж",
    },
    district: { az: "Nəsimi", en: "Nasimi", ru: "Насими" },
    metro: { az: "Nizami m.", en: "Nizami metro", ru: "м. Низами" },
    phone: "(+994) 55 226 24 85",
    whatsapp: "994552262485",
    coords: { lat: 40.3853403, lng: 49.8286822 },
    mapUrl:
      "https://www.google.com/maps/place/British+Academy/@40.3853403,49.8286822,17z/data=!3m1!4b1!4m6!3m5!1s0x40307d996360b07b:0xd8f7ec22c8ab81f1!8m2!3d40.3853403!4d49.8286822",
    isMain: true,
    workingHours: HOURS("09:00", "21:00"),
  },
  {
    name: {
      az: "Elmlər Akademiyası filialı",
      en: "Academy of Sciences Branch",
      ru: "Филиал Академии наук",
    },
    address: {
      az: "Əbdürrəhim Bəy Haqverdiyev 48, Bakı 1141",
      en: "48 Abdurrahim Bey Hagverdiyev, Baku 1141",
      ru: "Абдуррагим бек Ахвердиев 48, Баку 1141",
    },
    district: { az: "Yasamal", en: "Yasamal", ru: "Ясамал" },
    metro: {
      az: "Elmlər Akademiyası m.",
      en: "Elmlar Akademiyasi metro",
      ru: "м. Академия наук",
    },
    phone: "(+994) 55 215 35 77",
    whatsapp: "994552153577",
    coords: { lat: 40.3799872, lng: 49.8128913 },
    mapUrl:
      "https://www.google.com/maps/place/British+Academy+-+Elml%C9%99r+filial%C4%B1/@40.3799872,49.8128913,17z/data=!3m1!4b1!4m6!3m5!1s0x40307de9861dc6bf:0xed0648981d6adff1!8m2!3d40.3799872!4d49.8128913",
    workingHours: HOURS("10:00", "20:00"),
  },
  {
    name: {
      az: "Nəriman Nərimanov filialı",
      en: "Nariman Narimanov Branch",
      ru: "Филиал Наримана Нариманова",
    },
    address: {
      az: "Azaro Plaza, 3-cü mərtəbə",
      en: "Azaro Plaza, 3rd floor",
      ru: "Azaro Plaza, 3-й этаж",
    },
    district: { az: "Nərimanov", en: "Narimanov", ru: "Нариманов" },
    metro: { az: "Nərimanov m.", en: "Narimanov metro", ru: "м. Нариманов" },
    phone: "(+994) 55 215 35 79",
    whatsapp: "994552153579",
    coords: { lat: 40.3955703, lng: 49.8618075 },
    mapUrl:
      "https://www.google.com/maps/place/AZARO+PLAZA/@40.3955703,49.8618075,17z/data=!4m6!3m5!1s0x2b88e9f66345b2a1:0xb339a363e731baed!8m2!3d40.3955703!4d49.8618075",
    workingHours: HOURS("09:00", "21:00"),
  },
  {
    name: {
      az: "Əhmədli filialı",
      en: "Ahmadli Branch",
      ru: "Филиал Ахмедли",
    },
    address: {
      az: "Əhmədli, Babək pr. 88",
      en: "Ahmadli, 88 Babek Ave",
      ru: "Ахмедли, пр. Бабека 88",
    },
    district: { az: "Xətai", en: "Khatai", ru: "Хатаи" },
    metro: {
      az: "Həzi Aslanov m.",
      en: "Hazi Aslanov metro",
      ru: "м. Ази Асланов",
    },
    phone: "(+994) 50 370 05 09",
    whatsapp: "994503700509",
    coords: { lat: 40.3858492, lng: 49.9544682 },
    mapUrl:
      "https://www.google.com/maps/place/British+Academy,+%C6%8Fhm%C9%99dli+filial%C4%B1/@40.3858492,49.9544682,17z/data=!3m1!4b1!4m6!3m5!1s0x403063805866c961:0x457dec7b957b6093!8m2!3d40.3858492!4d49.9544682",
    workingHours: HOURS("09:00", "20:00"),
  },
];
