"use client";

import { useEffect, useState } from "react";

/**
 * Top fixed scroll-progress bar (0→100%) mirroring the static site's
 * #ba-progress. Fills based on window scroll position and is mounted site-wide
 * from the Header so every page gets it.
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="ba-progress"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${pct}%`,
        background: "var(--accent)",
        zIndex: 70,
        transition: "width .08s linear",
        pointerEvents: "none",
      }}
    />
  );
}
