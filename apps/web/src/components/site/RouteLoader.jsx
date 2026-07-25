"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Client navigation loader — a "walking" mascot overlay shown while moving
 * between pages. Implemented WITHOUT a loading.js so it never introduces a
 * Suspense boundary that would turn notFound() into a soft-404.
 *
 * It intercepts internal <a> clicks (capture phase) to show instantly, then
 * hides once the pathname/search actually changes.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const key = pathname + "?" + search.toString();
  const current = useRef(key);

  // Hide as soon as the route has changed.
  useEffect(() => {
    if (current.current !== key) {
      current.current = key;
      setActive(false);
    }
  }, [key]);

  // Show on same-origin link navigations.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    // Safety: also hide on back/forward and on full load.
    const onHide = () => setActive(false);
    window.addEventListener("pageshow", onHide);
    return () => {
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
    <div className="ba-loader" role="status" aria-live="polite" aria-label="Yüklənir">
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
