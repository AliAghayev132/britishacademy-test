"use client";

// React
import { useId, useState } from "react";

/**
 * Açılıb-bağlanan bölmə (mobil menyu akkordeonu).
 *
 * Native `<details>/<summary>` əvəzinə: vəziyyət React-dədir (menyu bağlananda
 * sıfırlanır), `aria-expanded`/`aria-controls` ekran oxuyucuya düzgün
 * elan olunur və görünüş bütün brauzerlərdə eynidir (Safari `summary`
 * markerini və fokus halqasını fərqli çəkirdi).
 */
export function Disclosure({ label, className = "", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`ba-macc${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="ba-macc-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      <div id={id} className="ba-macc-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
