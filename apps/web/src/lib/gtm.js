/**
 * Google Tag Manager konteyner ID-sinin yoxlanışı.
 *
 * NİYƏ AYRICA (KOMPONENTDƏN KƏNAR) MODUL: ID inline skriptin İÇİNƏ yazılır,
 * yəni yoxlanış təhlükəsizlik sərhədidir və öz testi olmalıdır. Komponentin
 * içində qalsaydı, onu yoxlamaq üçün `next/script`-i də yükləmək lazım
 * gələrdi.
 *
 * Format: `GTM-` + böyük hərf/rəqəm. Uyğun gəlməyən dəyər BOŞ qaytarılır və
 * GTM ümumiyyətlə render olunmur — «səssiz sınıq skript» yerinə «heç nə».
 */
const VALID = /^GTM-[A-Z0-9]{4,20}$/;

export function gtmIdOf(raw) {
  const id = String(raw || "").trim().toUpperCase();
  return VALID.test(id) ? id : "";
}
