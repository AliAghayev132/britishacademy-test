"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/useT";

/**
 * Client navigation loader — a "walking" mascot overlay shown while moving
 * between pages. Implemented WITHOUT a loading.js so it never introduces a
 * Suspense boundary that would turn notFound() into a soft-404.
 *
 * GECİKMƏ İLƏ (audit #32): əvvəl hər keçiddə səhifə hazır olsa belə ən azı
 * 550 ms pərdə göstərilir və klik bloklanırdı. İndi göstərici yalnız keçid
 * DELAY_MS-dən uzun çəkəndə görünür; sürətli keçiddə heç görünmür, minimum
 * müddət də yoxdur.
 */
const DELAY_MS = 300;

export function RouteLoader() {
  // ── State / derived ──
  const t = useT();
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const key = pathname + "?" + search.toString();
  const current = useRef(key);
  const timer = useRef(null);
  const downPos = useRef(null); // son pointerdown mövqeyi (drag aşkarı üçün)

  // ── Effects ──
  // Route dəyişdi — gözləyən göstərici ləğv olunur, görünən gizlənir.
  useEffect(() => {
    if (current.current === key) return;
    current.current = key;
    clearTimeout(timer.current);
    setActive(false);
  }, [key]);

  // Show on same-origin link navigations (after DELAY_MS).
  useEffect(() => {
    // Sürüşdürmə (məs. Swiper) başladığı pointerdown mövqeyini yadda saxla.
    const onDown = (e) => { downPos.current = { x: e.clientX, y: e.clientY }; };
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Drag nəticəsində yaranan fantom klik (Swiper swipe və s.) — ötür.
      const d = downPos.current;
      if (d && (Math.abs(e.clientX - d.x) > 10 || Math.abs(e.clientY - d.y) > 10)) return;
      const a = e.target.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      const target = a.getAttribute("target");
      if (!href || target === "_blank" || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || a.hasAttribute("download")) return;
      // External?
      let dest;
      try { dest = new URL(href, window.location.href); } catch { return; }
      if (dest.origin !== window.location.origin) return;
      if (dest.pathname + dest.search === window.location.pathname + window.location.search) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setActive(true), DELAY_MS);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick, true);
    // Safety: also hide on back/forward and on full load.
    const onHide = () => {
      clearTimeout(timer.current);
      setActive(false);
    };
    window.addEventListener("pageshow", onHide);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onHide);
    };
  }, []);

  // Never let the overlay get stuck if navigation is cancelled.
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="ba-loader" role="status" aria-live="polite" aria-label={t("common.loader")}>
      <div className="ba-loader-inner">
        {/* The shield logo "walks" while the page loads. Swap the background to
            /assets/mascot/walk.webp here once a dedicated walking mascot exists. */}
        <span
          className="ba-loader-mascot"
          style={{ backgroundImage: "url(/assets/shield.png)" }}
        />
        <div className="ba-loader-bar"><span /></div>
      </div>
    </div>
  );
}
