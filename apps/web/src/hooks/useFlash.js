"use client";

// React
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Qısa müddətli vəziyyət: «Kopyalandı ✓», «Yadda saxlandı» kimi işarə bir
 * neçə saniyə görünüb özü sıfırlanır.
 *
 * Əvvəl hər yerdə `setX(true); setTimeout(() => setX(false), 1600)` yazılırdı:
 * ardıcıl iki klikdə birinci taymer ikincinin işarəsini vaxtından əvvəl
 * söndürürdü, komponent bağlandıqdan sonra isə state yenilənirdi.
 *
 * @returns {[any, (value?: any) => void]} [cari dəyər, göstər(dəyər = true)]
 */
export function useFlash(initial = false, ms = 1600) {
  const [value, setValue] = useState(initial);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback(
    (next = true) => {
      clearTimeout(timer.current);
      setValue(next);
      timer.current = setTimeout(() => setValue(initial), ms);
    },
    [initial, ms],
  );

  return [value, flash];
}
