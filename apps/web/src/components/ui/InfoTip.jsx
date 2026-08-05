"use client";

// ── Info tip ──
// Small "i" button shown next to a field label. Click/hover reveals a short
// explanation of what the field controls / what it's related to.

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

export function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const f = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [open]);
  if (!text) return null;
  return (
    <span className="relative inline-flex align-middle" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-gray-400 transition-colors hover:text-[#00157A]"
        aria-label="Məlumat"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-1/2 top-full z-30 mt-1.5 w-56 -translate-x-1/2 rounded-lg bg-[#14141c] px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}
