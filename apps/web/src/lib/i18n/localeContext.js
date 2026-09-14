"use client";

// Cari dil (az/en/ru) client komponentlərə kontekst ilə çatdırılır. Server
// layout `locale`-i x-lang header-dən oxuyub LocaleProvider-ə ötürür.
//
// NİYƏ lib-də: useT (lib) və komponentlər ikisi də bunu işlədir. Kontekst
// komponentlərdə olsaydı lib → components → lib dövri importu yaranırdı.

// React
import { createContext, useContext } from "react";

export const LocaleContext = createContext("az");

export function useLocale() {
  return useContext(LocaleContext);
}
