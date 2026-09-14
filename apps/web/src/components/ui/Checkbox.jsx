"use client";

// Icons
import { Check } from "lucide-react";

// Lib
import { useMarkDirty } from "@/lib";

/**
 * Brend dizaynlı qeyd qutusu — native `<input type="checkbox">` əvəzi.
 *
 * Native qutu brauzerə görə fərqli çəkilir, rəngi yalnız `accent-color` ilə
 * (hər yerdə yox) dəyişir və admin formasında «dəyişiklik» işarəsi vermirdi.
 * `role="checkbox"` + `aria-checked` ilə ekran oxuyucu onu qutu kimi elan edir,
 * Boşluq/Enter düymə kimi işləyir.
 *
 * @param {(checked: boolean) => void} onChange
 */
export function Checkbox({ checked, onChange, label, disabled = false, className = "", id }) {
  const markDirty = useMarkDirty();
  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={Boolean(checked)}
      disabled={disabled}
      onClick={() => {
        markDirty();
        onChange?.(!checked);
      }}
      className={`inline-flex items-center gap-2 text-left text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-4 w-4 flex-none place-items-center rounded border transition ${
          checked ? "border-[#00157A] bg-[#00157A] text-white" : "border-gray-300 bg-white"
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
