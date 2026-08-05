"use client";

// ── Actions menu ──
// Row/operation actions. Up to `max` (default 3) render as labelled buttons
// (each says what it does). More than that collapse into a "⋯" dropdown that
// opens on click.

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

function toneClasses(tone) {
  if (tone === "danger") return "border-red-200 text-red-600 hover:bg-red-50";
  if (tone === "primary") return "border-transparent bg-[#00157A] text-white hover:bg-[#00105e]";
  return "border-gray-200 text-gray-700 hover:bg-gray-50";
}

function ActionButton({ label, icon: Icon, onClick, tone }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${toneClasses(tone)}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

/** actions: [{ label, icon, onClick, tone }] (falsy entries ignored). */
export function ActionsMenu({ actions = [], max = 3 }) {
  const list = actions.filter(Boolean);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (list.length === 0) return null;

  if (list.length <= max) {
    return <div className="flex flex-wrap justify-end gap-2">{list.map((a, i) => <ActionButton key={i} {...a} />)}</div>;
  }

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Əməliyyatlar"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <MoreHorizontal className="h-4 w-4" /> Əməliyyatlar
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
          {list.map((a, i) => {
            const Icon = a.icon;
            const danger = a.tone === "danger";
            return (
              <button
                key={i}
                onClick={() => { setOpen(false); a.onClick?.(); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors ${danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
