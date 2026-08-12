"use client";

// Cari dil (az/en/ru) client komponentlərə çatdırılır. Server layout `locale`-i
// x-lang header-dən oxuyub ötürür. LocaleLink və dil seçicisi bunu istifadə edir.
import { createContext, useContext } from "react";

export const LOCALES = ["az", "en", "ru"];
export const LOCALE_LABELS = { az: "AZ", en: "EN", ru: "RU" };

const LocaleCtx = createContext("az");

export function LocaleProvider({ locale = "az", children }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}

/** Daxili path-a dil prefiksi əlavə et (az → prefikssiz). */
export function withLocale(locale, href) {
  if (!href || typeof href !== "string" || !href.startsWith("/")) return href;
  if (locale === "az") return href;
  if (href === "/") return `/${locale}`;
  return `/${locale}${href}`;
}

/** Path-dan mövcud dil prefiksini çıxar (switcher üçün). */
export function stripLocale(pathname) {
  const seg = (pathname || "/").split("/")[1];
  if (seg === "en" || seg === "ru") {
    const rest = pathname.slice(seg.length + 1);
    return rest || "/";
  }
  return pathname || "/";
}
