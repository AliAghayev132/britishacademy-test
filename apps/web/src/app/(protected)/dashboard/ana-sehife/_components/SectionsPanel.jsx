"use client";

// Icons
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock } from "lucide-react";

/**
 * «Bölmələr» tabı — nə görünür, hansı sırada.
 * `rows` vəziyyəti səhifədədir, çünki yadda saxlama onu forma ilə birgə göndərir.
 */
export function SectionsPanel({ rows, move, toggleSection }) {
  const visible = rows.filter((r) => r.enabled).length;

  return (
    <>
      <p className="mb-3 text-sm text-gray-500">
        Ana səhifədə <b className="text-gray-900">{visible}</b> / {rows.length} bölmə görünür.
        Sıranı oxlarla dəyişin.
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className={`flex items-start gap-3 rounded-xl border p-4 transition ${
              r.enabled ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50"
            }`}
          >
            <div className="flex flex-col gap-0.5 pt-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Yuxarı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label="Aşağı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="mt-1 grid h-6 w-6 flex-none place-items-center rounded-md bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${r.enabled ? "text-gray-900" : "text-gray-400"}`}>
                  {r.label}
                </span>
                {r.locked && (
                  <span title="Bu bölmə gizlədilə bilməz" className="text-gray-300">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
                {r.limit && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                    maks. {r.limit}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{r.hint}</p>
            </div>

            <button
              onClick={() => toggleSection(r.key)}
              disabled={r.locked}
              title={r.locked ? "Bu bölmə həmişə göstərilir" : r.enabled ? "Gizlət" : "Göstər"}
              className={`inline-flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                r.locked
                  ? "cursor-not-allowed border-gray-100 text-gray-300"
                  : r.enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {r.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {r.enabled ? "Görünür" : "Gizli"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
