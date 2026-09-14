"use client";

// Icons
import { Copy, Check, Trash2, BarChart3, Power, QrCode } from "lucide-react";

// Utils
import { fmtDateTime, fmtNumber } from "@/utils";

/** Cədvəlin bir sətri — link məlumatı və əməliyyat düymələri. */
export default function LinkRow({ link: l, copied, onCopy, onQr, onStats, onToggle, onDelete }) {
  return (
    <tr className={l.isActive ? "" : "bg-gray-50/60 opacity-70"}>
      <td className="px-4 py-3">
        <div className="font-mono text-xs font-bold text-gray-900">/r/{l.code}</div>
        {l.title && <div className="mt-0.5 text-xs text-gray-500">{l.title}</div>}
      </td>
      <td className="max-w-[260px] px-4 py-3">
        <div className="truncate font-mono text-xs text-gray-500" title={l.target}>
          {l.target}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-bold text-gray-900">
          {fmtNumber(l.clicks)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {fmtDateTime(l.lastClickAt, { seconds: true })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onCopy(l.code)}
            title="Linki kopyala"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
          >
            {copied
              ? <Check className="h-4 w-4 text-emerald-600" />
              : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onQr(l)}
            title="QR kod"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button
            onClick={() => onStats(l)}
            title="Hesabat"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToggle(l)}
            title={l.isActive ? "Bağla" : "Aç"}
            className={`rounded-lg border p-1.5 transition ${
              l.isActive
                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                : "border-gray-200 text-gray-400 hover:bg-gray-50"
            }`}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(l)}
            title="Sil"
            className="rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
