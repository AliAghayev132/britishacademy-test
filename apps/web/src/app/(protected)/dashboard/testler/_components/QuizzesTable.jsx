"use client";

// Icons
import { Trash2, Pencil, Eye } from "lucide-react";

// Utils
import { fmtNumber } from "@/utils";

// Local
import { locAz } from "../../_forms/Localized";

/** Testlərin siyahı cədvəli. */
export function QuizzesTable({ items, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Ünvan</th>
              <th className="px-4 py-3 text-right">Sual</th>
              <th className="px-4 py-3 text-right">Baxış</th>
              <th className="px-4 py-3 text-right">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  Hələ test yoxdur. Developer bölməsindən başlanğıc testləri yükləyə bilərsən.
                </td>
              </tr>
            )}
            {items.map((q) => (
              <tr key={q._id} className={q.isActive ? "" : "bg-gray-50/60 opacity-70"}>
                <td className="px-4 py-3 font-semibold text-gray-900">{locAz(q.title)}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">/testler/{q.slug}</td>
                <td className="px-4 py-3 text-right text-gray-700">{q.questions?.length || 0}</td>
                <td className="px-4 py-3 text-right text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    {fmtNumber(q.views)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(q)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
                      title="Redaktə et"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(q)}
                      className="rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
