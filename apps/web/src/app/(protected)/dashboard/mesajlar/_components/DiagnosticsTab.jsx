"use client";

// Icons
import { AlertTriangle, Clock, Package, QrCode, Unplug } from "lucide-react";

// Utils
import { fmtDateTime, fmtNumber } from "@/utils";

// Local
import { UpdateNotice } from "./UpdateNotice";
import { fmtUptime } from "./uptime";

function Metric({ icon: Icon, label, value, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-500",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
      <span className={`hidden h-10 w-10 flex-none place-items-center rounded-lg sm:grid ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

/**
 * Diaqnostika — bağlantı kəsiləndə ilk verilən suallar.
 *
 * Əvvəl səhifənin başında açılıb-bağlanan blok idi və hər tabın üstündə yer
 * tuturdu; indi ayrıca tabdır.
 */
export function DiagnosticsTab({ status: s, onCheckVersion, checkingVersion }) {
  const errors = s.logSummary?.errors || 0;
  const disconnects = s.logSummary?.disconnects || 0;

  const rows = [
    ["Kitabxana", s.libVersion ? `whatsapp-web.js v${s.libVersion}` : "—"],
    ["Vəziyyət", s.state || "—"],
    ["Sessiya faylı", s.hasSession ? "var" : "yoxdur"],
    ["Sağlamlıq nəzarəti", s.healthWatch ? "işləyir" : "dayanıb"],
    ["Hesab", s.connectedAs ? `${s.connectedAs}${s.phoneNumber ? ` · +${s.phoneNumber}` : ""}` : "—"],
    ["Bağlantı açıqdır", s.uptimeSec > 0 ? fmtUptime(s.uptimeSec) : "—"],
    ["Cihaz", s.deviceManufacturer || "—"],
    ["Platforma", s.platform || "—"],
    ["WhatsApp versiyası", s.waVersion || "—"],
    ["Chrome", s.chromePath || "sistem defoltu"],
    ["Versiya yoxlanıb", fmtDateTime(s.version?.checkedAt, { seconds: true })],
    ["Sessiya qovluğu", s.sessionDir || "—"],
  ];

  return (
    <div className="space-y-4">
      <UpdateNotice version={s.version} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={AlertTriangle} label="Xəta (son 24 saat)" value={fmtNumber(errors)} tone={errors ? "red" : "gray"} />
        <Metric icon={Unplug} label="Kəsilmə (son 24 saat)" value={fmtNumber(disconnects)} tone={disconnects ? "amber" : "gray"} />
        <Metric icon={QrCode} label="QR cəhdi" value={fmtNumber(s.qrCount)} tone="blue" />
        <Metric icon={Clock} label="Server açıqdır" value={fmtUptime(s.serverUptimeSec || 0)} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-bold text-gray-900">Texniki məlumat</h2>
          <button
            onClick={onCheckVersion}
            disabled={checkingVersion}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <Package className="h-3.5 w-3.5" /> Versiyanı indi yoxla
          </button>
        </div>
        <dl className="grid divide-y divide-gray-50 sm:grid-cols-2 sm:divide-y-0">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 border-gray-50 px-5 py-2.5 text-sm sm:border-b">
              <dt className="w-32 flex-none text-gray-500 sm:w-40">{k}</dt>
              <dd className="min-w-0 truncate font-medium text-gray-800" title={String(v)}>{v}</dd>
            </div>
          ))}
        </dl>
        {s.version?.error && <p className="px-5 py-3 text-xs text-gray-400">{s.version.error}</p>}
      </div>
    </div>
  );
}
