/**
 * Bakı vaxtı ilə günlər (audit #39).
 *
 * Statistika ekranları fərqli saat qurşaqlarında hesablanırdı: məzmun
 * statistikası UTC, konversiya Bakı, link statistikası günlərdə UTC,
 * saatlarda Bakı. Bakı vaxtı ilə 00:00–04:00 arası gələn müraciət bir tabda
 * əvvəlki günə düşürdü. Tarix süzgəcləri isə serverin öz saatı ilə bitirdi.
 *
 * Azərbaycanda 2016-dan yay vaxtı yoxdur — sabit +04:00.
 */

export const BAKU_TZ = "+04:00";
/** MongoDB `$dateToString` / `$hour` üçün. */
export const BAKU_ZONE = "Asia/Baku";

/** Tarixin Bakı vaxtı ilə günü (YYYY-MM-DD). */
export const bakuDay = (d) => new Date(d.getTime() + 4 * 3600e3).toISOString().slice(0, 10);

/** Bakı gününün başlanğıcı. */
export const bakuDayStart = (day) => new Date(`${day}T00:00:00.000${BAKU_TZ}`);

/** Son `days` gün (bu gün daxil), köhnədən yeniyə. */
export const bakuDays = (days, now = new Date()) =>
  Array.from({ length: days }, (_, i) => bakuDay(new Date(now.getTime() - (days - 1 - i) * 864e5)));

/**
 * Sorğudakı tarix → Date. `YYYY-MM-DD` Bakı günü kimi oxunur; `edge: "end"`
 * günün SONUNU verir (eyni gün seçiləndə aralıq boş qalmasın). Tam ISO
 * vaxt verilərsə olduğu kimi götürülür.
 */
export const parseDayParam = (raw, edge = "start") => {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T${edge === "end" ? "23:59:59.999" : "00:00:00.000"}${BAKU_TZ}`)
    : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** `?from=&to=` → Mongo aralığı və ya null. */
export const dateRange = (from, to) => {
  const range = {};
  const a = parseDayParam(from);
  const b = parseDayParam(to, "end");
  if (a) range.$gte = a;
  if (b) range.$lte = b;
  return Object.keys(range).length ? range : null;
};
