/**
 * Filial məlumatları — müştəridən gələn real ünvan, telefon, WhatsApp və
 * xəritə linkləri.
 *
 * Həm seed, həm də BranchImportService bu fayldan oxuyur. Əvvəl məlumat
 * yalnız seed-in içində idi və mövcud bazaya tətbiq etmək üçün hər şeyi
 * silib yenidən yükləmək lazım gəlirdi.
 */
// Müştəridən gələn real filial məlumatları (ünvan, telefon, WhatsApp, xəritə).
// `mapUrl` qısa Google linkidir — «Xəritədə aç» düyməsi üçün; iframe embed-i
// isə ünvandan qurulur (qısa linklər iframe-də açılmır).
export const BRANCHES = [
  {
    name: "Mərkəz — Caspian Plaza",
    address: "C.Cabbarlı 44, Caspian Plaza, 9-cu mərtəbə",
    district: "Nəsimi",
    metro: "Nizami m.",
    phone: "(+994) 55 226 24 85",
    whatsapp: "994552262485",
    mapUrl: "https://maps.app.goo.gl/fyo3Pt6xF1XyZUjB8",
    isMain: true,
    workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "21:00" }],
  },
  {
    name: "Nəriman Nərimanov filialı",
    address: "Azaro Plaza, 3-cü mərtəbə",
    district: "Nərimanov",
    metro: "Nərimanov m.",
    phone: "(+994) 55 215 35 79",
    whatsapp: "994552153579",
    mapUrl: "https://maps.app.goo.gl/zpTahekdrgR6bQDf7",
    workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "21:00" }],
  },
  {
    name: "Əhmədli filialı",
    address: "Əhmədli, Babək pr. 88",
    district: "Xətai",
    metro: "Həzi Aslanov m.",
    phone: "(+994) 50 370 05 09",
    whatsapp: "994503700509",
    mapUrl: "https://maps.app.goo.gl/7ra4Nh45aaRxTEi98",
    workingHours: [{ days: "B.e–Şənbə", from: "09:00", to: "20:00" }],
  },
  {
    name: "Elmlər Akademiyası filialı",
    address: "Əbdürrəhim Bəy Haqverdiyev 48, Bakı 1141",
    district: "Yasamal",
    metro: "Elmlər Akademiyası m.",
    phone: "(+994) 55 215 35 77",
    whatsapp: "994552153577",
    mapUrl:
      "https://www.google.com/maps?q=British+Academy+-+Elml%C9%99r+filial%C4%B1,+48+%C6%8Fbd%C3%BCrr%C9%99him+B%C9%99y+Haqverdiyev,+Baku+1141&ftid=0x40307de9861dc6bf:0xed0648981d6adff1",
    workingHours: [{ days: "B.e–Şənbə", from: "10:00", to: "20:00" }],
  },
];
