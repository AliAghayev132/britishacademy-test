"use client";

// React
import { useMemo } from "react";

// Local
import { HOME_LIMITS } from "./helpers";

/**
 * Ana səhifə seçimi — limiti gizli saxlamamaq üçün açıq göstərilir.
 * Seçilmişlərin sayı limitdən çoxdursa artıqları görünməyəcək.
 */
export default function HomeLimitNotice({ resource, items, hasFeatured }) {
  const featuredCount = useMemo(() => items.filter((i) => i.isFeatured).length, [items]);
  const HOME_LIMIT = HOME_LIMITS[resource];

  if (!(hasFeatured && HOME_LIMIT)) return null;

  return (
    <div
      className={`mb-3 rounded-lg px-3 py-2 text-sm ${
        featuredCount > HOME_LIMIT
          ? "bg-amber-50 text-amber-800"
          : "bg-blue-50 text-blue-800"
      }`}
    >
      Ana səhifə <b>{HOME_LIMIT}</b> element göstərir · seçilib: <b>{featuredCount}</b>
      {featuredCount > HOME_LIMIT ? (
        <>
          {" "}— artıq olan {featuredCount - HOME_LIMIT}-i görünməyəcək.
          Sıralama «Sıra» sahəsinə görədir.
        </>
      ) : featuredCount < HOME_LIMIT ? (
        <>
          {" "}— qalan {HOME_LIMIT - featuredCount} yer digər kurslarla
          avtomatik tamamlanır. Seçdikləriniz həmişə ƏVVƏLDƏ görünür.
        </>
      ) : (
        <> · Sıralama «Sıra» sahəsinə görədir.</>
      )}
    </div>
  );
}
