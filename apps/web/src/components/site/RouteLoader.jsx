"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/useT";

/**
 * Client navigation loader — a "walking" mascot overlay shown while moving
 * between pages. Implemented WITHOUT a loading.js so it never introduces a
 * Suspense boundary that would turn notFound() into a soft-404.
 *
 * It intercepts internal <a> clicks (capture phase) to show instantly, then
 * hides once the pathname/search actually changes.
 */
export function RouteLoader() {
  // ── State / derived ──
  const t = useT();
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const key = pathname + "?" + search.toString();
  const current = useRef(key);
  const shownAt = useRef(0);
  const downPos = useRef(null); // son pointerdown mövqeyi (drag aşkarı üçün)
  const MIN_MS = 550; // keep the loader up long enough to read (no flash-and-gone)

  // ── Effects ──
  // Hide once the route changed — but honour a minimum on-screen time.
  useEffect(() => {
    if (current.current === key) return;
    current.current = key;
    const elapsed = Date.now() - shownAt.current;
    if (elapsed >= MIN_MS) {
      setActive(false);
      return;
    }
    const t = setTimeout(() => setActive(false), MIN_MS - elapsed);
    return () => clearTimeout(t);
  }, [key]);

  // Show on same-origin link navigations.
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
      shownAt.current = Date.now();
      setActive(true);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick, true);
    // Safety: also hide on back/forward and on full load.
    const onHide = () => setActive(false);
    window.addEventListener("pageshow", onHide);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onHide);
    };
  }, []);

  // Never let the overlay get stuck if navigation is cancelled.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 8000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <div className="ba-loader" role="status" aria-live="polite" aria-label={t("common.loader")}>
      <div className="ba-loader-inner">
        {/* The shield logo "walks" while the page loads. Swap the background to
            /assets/mascot/walk.png here once a dedicated walking mascot exists. */}
        <span
          className="ba-loader-mascot"
          style={{ backgroundImage: "url(/assets/shield.png)" }}
        />
        <div className="ba-loader-bar"><span /></div>
      </div>
    </div>
  );
}
