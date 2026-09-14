"use client";

// React
import { useEffect, useState } from "react";

// Lib
import { NAV_GROUPS } from "@/lib";

/**
 * Naviqasiya qruplarının açıq/bağlı vəziyyəti.
 *
 * Qruplar AÇIQ başlayır. Bağlı başlasaydı, silinən «Digər resurslar»
 * düyməsinin problemini təkrarlayardıq: bölmələr yenə gizli qalardı.
 * İstifadəçi bağlayanda seçim localStorage-da saxlanılır ki, hər səhifə
 * keçidində açılmasın.
 */
export default function useSidebarGroups() {
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.key, true])),
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ba-nav-groups") || "null");
      if (saved && typeof saved === "object") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnız brauzerdə oxunur; SSR-də defolt (hamısı açıq) qalmalıdır
        setOpenGroups((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // Pozulmuş dəyər — defolt saxlanılır.
    }
  }, []);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("ba-nav-groups", JSON.stringify(next));
      } catch {
        // Quota/privat rejim — yaddaş olmadan da işləməlidir.
      }
      return next;
    });

  return [openGroups, toggleGroup];
}
