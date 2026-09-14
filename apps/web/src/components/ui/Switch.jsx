"use client";

// Lib
import { useMarkDirty } from "@/lib";

/**
 * Açar (aktiv/deaktiv).
 *
 * `role="switch"` + `aria-checked` — əvvəlki versiya adi düymə idi və ekran
 * oxuyucu vəziyyəti (açıq/bağlı) elan etmirdi.
 *
 * @param {(checked: boolean) => void} onChange
 */
export function Switch({ checked, onChange, label, disabled = false, id }) {
  const markDirty = useMarkDirty();
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      disabled={disabled}
      onClick={() => {
        markDirty();
        onChange?.(!checked);
      }}
      className="inline-flex items-center gap-2 text-left text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true" className={`relative h-6 w-11 flex-none rounded-full transition ${checked ? "bg-blue-900" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
