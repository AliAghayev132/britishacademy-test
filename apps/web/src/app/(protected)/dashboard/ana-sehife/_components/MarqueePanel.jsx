"use client";

// Local
import { LocalizedInput } from "../../_forms/Localized";
import { StatsEditor } from "./StatsEditor";
import { label } from "./shared";

/** «Lent və statistika» tabı. */
export function MarqueePanel({ form, set }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className={label}>Hərəkət edən lent — vergüllə (3 dildə)</label>
        <LocalizedInput value={form.marquee} onChange={(v) => set("marquee", v)} />
        <p className="mt-1 text-xs text-gray-400">Hero-nun altında sürüşən sözlər.</p>
      </div>

      <StatsEditor form={form} set={set} />
    </div>
  );
}
