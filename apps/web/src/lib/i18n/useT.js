"use client";

// Client komponentlər üçün tərcümə hook-u: t("key") cari dildə mətn qaytarır.
// Local
import { useLocale } from "./localeContext";
import { t as translate } from "./strings";

export function useT() {
  const locale = useLocale();
  return (key) => translate(locale, key);
}
