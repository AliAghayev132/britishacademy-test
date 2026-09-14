/**
 * API xətasından istifadəçiyə göstəriləcək mətn (RTK Query `unwrap()`, fetch,
 * `Error`).
 *
 * Əvvəl 60-dan çox yerdə `apiErrorMessage(err, "…")` əl ilə yazılırdı:
 *  • server validasiya xətasında yalnız ingiliscə «Validation error» görünürdü,
 *    hansı sahənin səhv olduğu (`errors[]`) itirdi;
 *  • yükləmə köməkçilərinin atdığı `Error`-un mesajı nəzərə alınmırdı.
 *
 * Şəbəkə xətası (FETCH_ERROR) və mesajsız cavab üçün `fallback` qaytarılır —
 * ictimai saytda o, cari dildə verilir.
 */
export function apiErrorMessage(err, fallback = "Xəta baş verdi") {
  const data = err?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.filter(Boolean).join("; ");
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  // RTK xətası obyektdir (status/data); `Error` isə yükləmə köməkçilərindən gəlir.
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
