"use client";

// ── Info tip ──
// Small "i" button shown next to a field label. Click/hover reveals a short
// explanation. Tooltip is rendered in a portal with fixed positioning so it is
// never clipped by a modal's `overflow-hidden`/`overflow-auto` container.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

export function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);

  // Düymənin yerinə görə tooltip mövqeyini hesabla (viewport-a nəzərən, fixed).
  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ left: r.left + r.width / 2, top: r.bottom + 8 });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => place();
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!text) return null;

  return (
    <span className="inline-flex align-middle">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 transition-colors hover:text-[#00157A]"
        aria-label="Məlumat"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <span
            style={{ position: "fixed", left: coords.left, top: coords.top, transform: "translateX(-50%)", zIndex: 200 }}
            className="pointer-events-none w-56 max-w-[calc(100vw-24px)] rounded-lg bg-[#14141c] px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-xl"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
