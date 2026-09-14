"use client";

// React
import { useId, useState } from "react";

// Icons
import { ChevronDown } from "lucide-react";

/**
 * Açılıb-bağlanan bölmə (admin paneli) — native `<details>` əvəzi.
 *
 * `aria-expanded`/`aria-controls` ilə elan olunur, ox işarəsi dönür və
 * görünüş brauzerdən asılı deyil (Safari `summary` markerini ayrıca çəkir).
 */
export function Collapsible({ title, defaultOpen = false, className = "", titleClassName = "", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 text-left ${titleClassName}`}
      >
        <span className="min-w-0">{title}</span>
        <ChevronDown className={`h-4 w-4 flex-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
