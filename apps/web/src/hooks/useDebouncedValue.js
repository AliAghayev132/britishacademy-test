"use client";

// React
import { useEffect, useState } from "react";

/**
 * Dəyərin «yazı dayandıqdan sonra» versiyası.
 *
 * Admin siyahılarında axtarış sahəsi hər hərfdə API sorğusu göndərirdi:
 * «Nərimanov» yazmaq 9 sorğu deməkdir, sürətli yazanda cavablar qarışıq
 * ardıcıllıqla gəlir və API-nin sürət limitinə (429) düşmək olur.
 */
export function useDebouncedValue(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
