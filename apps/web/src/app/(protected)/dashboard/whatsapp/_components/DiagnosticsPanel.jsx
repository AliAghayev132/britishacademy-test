"use client";

// Icons
import { Package } from "lucide-react";

// Components
import { Collapsible } from "@/components";

// Utils
import { fmtDateTime } from "@/utils";

// Local
import { fmtUptime } from "./uptime";

/** Diaqnostika — bağlantı kəsiləndə ilk verilən suallar. */
export function DiagnosticsPanel({ status: s, onCheckVersion, checkingVersion }) {
  return (
    <Collapsible
      className="rounded-xl border border-gray-200 bg-white px-5 py-3"
      titleClassName="text-sm font-semibold text-gray-700"
      title={<>
        Diaqnostika
        {s.logSummary?.errors > 0 && (
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            24 saatda {s.logSummary.errors} xəta
          </span>
        )}
        {s.logSummary?.disconnects > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {s.logSummary.disconnects} kəsilmə
          </span>
        )}
      </>}
    >
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Sessiya faylı", s.hasSession ? "var" : "yoxdur"],
          ["Chrome", s.chromePath || "sistem defoltu"],
          ["Sağlamlıq nəzarəti", s.healthWatch ? "işləyir" : "dayanıb"],
          ["QR cəhdi", String(s.qrCount ?? 0)],
          ["Cihaz", s.deviceManufacturer || "—"],
          ["Platforma", s.platform || "—"],
          ["WhatsApp versiyası", s.waVersion || "—"],
          ["Server açıqdır", fmtUptime(s.serverUptimeSec || 0)],
          ["Versiya yoxlanıb", fmtDateTime(s.version?.checkedAt, { seconds: true })],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="flex-none text-gray-500">{k}:</dt>
            <dd className="min-w-0 truncate font-medium text-gray-800" title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={onCheckVersion}
          disabled={checkingVersion}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <Package className="h-3.5 w-3.5" /> Versiyanı indi yoxla
        </button>
        {s.version?.error && <span className="self-center text-xs text-gray-400">{s.version.error}</span>}
        {s.sessionDir && (
          <span className="self-center font-mono text-xs text-gray-400" title={s.sessionDir}>
            {s.sessionDir}
          </span>
        )}
      </div>
    </Collapsible>
  );
}
