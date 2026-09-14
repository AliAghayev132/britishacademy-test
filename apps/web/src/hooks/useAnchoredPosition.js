"use client";

// React
import { useLayoutEffect, useState } from "react";

/**
 * `position: fixed` panelin (seçim siyahısı, təqvim, rəng seçici) düyməyə
 * bağlı koordinatları.
 *
 * Əvvəl üç komponent mövqeyi hər biri öz üsulu ilə və YALNIZ açılan anda
 * hesablayırdı: modalın içini sürüşdürəndə və ya pəncərənin ölçüsü dəyişəndə
 * panel yerində qalır, düymədən ayrılırdı. Burada sürüşdürmə (bütün
 * konteynerlər — capture) və resize-da yenidən hesablanır.
 *
 * Aşağıda yer azdırsa (`panelHeight`) panel yuxarı açılır; ekranın sağ
 * kənarından çıxmasın deyə `panelWidth` nəzərə alınır.
 *
 * @returns {{ left: number, top?: number, bottom?: number, width?: number } | null}
 */
export function useAnchoredPosition(open, anchorRef, { panelHeight = 280, panelWidth, gap = 4, matchWidth = false } = {}) {
  const [coords, setCoords] = useState(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const up = below < panelHeight && r.top > below;
      const width = panelWidth ?? r.width;
      setCoords({
        left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
        top: up ? undefined : r.bottom + gap,
        bottom: up ? window.innerHeight - r.top + gap : undefined,
        ...(matchWidth ? { width: r.width } : {}),
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [open, anchorRef, panelHeight, panelWidth, gap, matchWidth]);

  return open ? coords : null;
}
