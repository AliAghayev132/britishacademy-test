// Tarixi seçilmiş dildə yaz. Əvvəl hər yerdə "az-AZ" sabit idi — EN/RU
// səhifələrdə «14 sentyabr 2026» görünürdü (audit #31).
const DATE_LOCALE = { az: "az-AZ", en: "en-GB", ru: "ru-RU" };

export function formatDate(value, locale = "az") {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(DATE_LOCALE[locale] || DATE_LOCALE.az, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
