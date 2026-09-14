"use client";

// Local
import { Select } from "./Select";

/** 07:00 … 22:45, 15 dəqiqəlik addımla. */
const SLOTS = (() => {
  const out = [];
  for (let h = 7; h <= 22; h += 1) {
    for (let m = 0; m < 60; m += 15) {
      const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      out.push({ value: t, label: t });
    }
  }
  return out;
})();

/**
 * Saat seçimi — native `<input type="time">` əvəzi.
 *
 * Native saat sahəsi brauzerə görə 12 saatlıq (AM/PM) açıla bilirdi və
 * dərs qrafikində «07:00 PM» kimi görünürdü. Dərslər 15 dəqiqəlik addımla
 * planlaşdırılır; bazada fərqli dəqiqə (məs. 19:10) varsa o da siyahıya
 * əlavə olunur ki, açanda itməsin. Dəyər formatı eynidir: "HH:MM".
 */
export function TimeSelect({ value, onChange, placeholder = "--:--", className, disabled }) {
  const options = value && !SLOTS.some((o) => o.value === value) ? [{ value, label: value }, ...SLOTS] : SLOTS;
  return <Select options={options} value={value || ""} onChange={onChange} placeholder={placeholder} className={className} disabled={disabled} />;
}
