"use client";

// Utils
import { rowKey } from "@/utils";

// Local
import { LocalizedInput, toLoc } from "../../_forms/Localized";
import { label } from "./shared";

/** Statistika göstəriciləri (dəyər + etiket, hər ikisi 3 dildə). */
export function StatsEditor({ form, set }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <label className={label}>Statistika (məs. 20 000+ · məzun)</label>
        <button
          onClick={() => set("stats", [...form.stats, { _key: rowKey(), label: toLoc(""), value: toLoc("") }])}
          className="rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700"
        >
          + Göstərici
        </button>
      </div>
      {form.stats.length === 0 && <p className="text-sm text-gray-400">Göstərici əlavə edilməyib</p>}
      <div className="space-y-3">
        {form.stats.map((row, i) => (
          <div key={row._key} className="flex items-start gap-3">
            <div className="flex-1">
              <label className={label}>Dəyər</label>
              <LocalizedInput value={row.value} onChange={(v) => set(`stats.${i}.value`, v)} placeholder="20 000+" />
            </div>
            <div className="flex-1">
              <label className={label}>Etiket</label>
              <LocalizedInput value={row.label} onChange={(v) => set(`stats.${i}.label`, v)} placeholder="məzun tələbə" />
            </div>
            <button
              onClick={() => set("stats", form.stats.filter((_, j) => j !== i))}
              className="mt-6 rounded-lg border border-gray-200 p-2 text-red-500 hover:bg-red-50"
              aria-label="Sil"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
