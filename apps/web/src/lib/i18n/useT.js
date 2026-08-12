"use client";

// Client komponentlər üçün tərcümə hook-u: t("key") cari dildə mətn qaytarır.
import { useLocale } from "@/components/site/LocaleProvider";
import { t as translate } from "./strings";

export function useT() {
  const locale = useLocale();
  return (key) => translate(locale, key);
}
