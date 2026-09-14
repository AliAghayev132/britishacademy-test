"use client";

// React
import { useCallback } from "react";

// Next
import { usePathname } from "next/navigation";

// Lib
import { useLocale, stripLocale, withLocale } from "@/lib";

/**
 * Dil dəyişdirmə məntiqi — iki fərqli görünüş (masaüstü lent, mobil dropdown)
 * eyni davranışı paylaşsın deyə ayrıca hook-dur.
 */
export default function useLangSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const base = stripLocale(pathname);
  const go = useCallback(
    (l) => {
      if (l === locale) return;
      document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
      // withLocale həm prefiksi qoyur, həm slug-u hədəf dilə çevirir
      // (/en/contact → /ru/kontakty).
      const target = withLocale(l, base);
      // Hard reload — serverdən tam yenidən render (nav/menyu daxil) yeni dildə.
      window.location.assign(target || "/");
    },
    [locale, base],
  );
  return { locale, go };
}
