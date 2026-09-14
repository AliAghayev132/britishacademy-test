/**
 * Admin paneli üçün ümumi formatlayıcılar (tarix, saat, rəqəm).
 *
 * Əvvəl hər səhifədə öz `fmt`/`fmtDate`/`fmtTime` funksiyası vardı (9 ayrı
 * variant) və nəticə səhifədən səhifəyə fərqlənirdi: biri saniyə göstərir,
 * biri ili atır, biri boş dəyərdə «Invalid Date» yazırdı. Üstəlik vaxt
 * brauzerin saat qurşağında göstərilirdi, statistika isə serverdə Bakı vaxtı
 * ilə hesablanır — xaricdən baxan adminin gördüyü saat hesabatla uyğun
 * gəlmirdi.
 *
 * İctimai sayt dilə görə formatlayır — bax lib/i18n/date.js.
 */

const LOCALE = "az-AZ";
const TIME_ZONE = "Asia/Baku";
export const EMPTY = "—";

const toDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 14.09.2026, 13:05 — `seconds` saniyəni, `year: false` ili göstərmir. */
export function fmtDateTime(value, { seconds = false, year = true, empty = EMPTY } = {}) {
  const d = toDate(value);
  if (!d) return empty;
  return d.toLocaleString(LOCALE, {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    ...(year ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    hour12: false,
  });
}

/** 14.09.2026 */
export function fmtDate(value, empty = EMPTY) {
  const d = toDate(value);
  if (!d) return empty;
  return d.toLocaleDateString(LOCALE, { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });
}

/** 13:05 (və ya 13:05:22) */
export function fmtTime(value, { seconds = false, empty = EMPTY } = {}) {
  const d = toDate(value);
  if (!d) return empty;
  return d.toLocaleTimeString(LOCALE, {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...(seconds ? { second: "2-digit" } : {}),
    hour12: false,
  });
}

/** 12 345 — boş/yanlış dəyər 0 sayılır. */
export function fmtNumber(value) {
  return (Number(value) || 0).toLocaleString(LOCALE);
}
