"use client";

// Cari dil (az/en/ru) client komponentlərə çatdırılır. Server layout `locale`-i
// x-lang header-dən oxuyub ötürür. LocaleLink və dil seçicisi bunu istifadə edir.
import { createContext, useContext } from "react";
import { buildPath, canonicalPath, splitLocale } from "@/lib/i18n/routes";

export const LOCALES = ["az", "en", "ru"];
export const LOCALE_LABELS = { az: "AZ", en: "EN", ru: "RU" };

const LocaleCtx = createContext("az");

export function LocaleProvider({ locale = "az", children }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/**
 * Kanonik (AZ) daxili path -> cari dildeki public URL.
 * Hem dil prefiksini qoyur, hem de slug-u tercume edir:
 *   withLocale("en", "/elaqe") -> "/en/contact"
 */
export function withLocale(locale, href) {
  if (!href || typeof href !== "string" || !href.startsWith("/")) return href;
  return buildPath(href, locale);
}

/**
 * Public path-dan dil prefiksini VE slug tercumesini goturur - kanonik AZ path
 * qaytarir. Dil secicisi bunu alib withLocale ile hedef dile cevirir, ona gore
 * /en/contact -> /ru/kontakty kecidi duzgun isleyir.
 */
export function stripLocale(pathname) {
  return canonicalPath(splitLocale(pathname).path);
}
