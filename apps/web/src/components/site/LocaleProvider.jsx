"use client";

// Server layout-dan gələn cari dili (az/en/ru) client ağacına ötürür.
// Kontekstin özü, useLocale və withLocale/stripLocale lib-dədir (@/lib).

// Lib
import { LocaleContext } from "@/lib";

export function LocaleProvider({ locale = "az", children }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
