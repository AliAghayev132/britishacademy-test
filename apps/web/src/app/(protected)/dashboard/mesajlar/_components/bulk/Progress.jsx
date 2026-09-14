"use client";

// Icons
import {
  Loader2,
  StopCircle,
  Timer,
  CheckCircle2,
  XCircle,
  SkipForward,
  Radio,
} from "lucide-react";

// Local
import { fmtDuration } from "../shared";
import { LiveFeed } from "./LiveFeed";

function Stat({ Icon, cls, value, label: text }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${cls}`}>
      <Icon className="h-4 w-4" /> <b>{value}</b> {text}
    </span>
  );
}

/** Gedən göndərişin paneli: faiz, sayğaclar, canlı axın, dayandırma. */
export function Progress({ queue, onCancel, live }) {
  const done = queue.done ?? (queue.sent || 0) + (queue.failed || 0) + (queue.skipped || 0);
  const pct = Math.round((done / (queue.total || 1)) * 100);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          {queue.channel === "email" ? "E-poçt" : "WhatsApp"} göndərilir — {done} / {queue.total}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
            {pct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Bağlantı göstəricisi: socket qopsa admin niyə yenilənmədiyini bilsin. */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              live ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
            title={live ? "Canlı bağlantı aktivdir" : "Canlı bağlantı yoxdur — arada bir yoxlanılır"}
          >
            <Radio className={`h-3.5 w-3.5 ${live ? "animate-pulse" : ""}`} />
            {live ? "Canlı" : "Sorğu ilə"}
          </span>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <StopCircle className="h-4 w-4" /> Dayandır
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-900 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <Stat Icon={CheckCircle2} cls="text-emerald-600" value={queue.sent || 0} label="göndərildi" />
        <Stat Icon={XCircle} cls="text-red-600" value={queue.failed || 0} label="alınmadı" />
        <Stat Icon={SkipForward} cls="text-amber-600" value={queue.skipped || 0} label="ötürüldü" />
        {queue.delaySec > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-4 w-4" /> {queue.delaySec} san fasilə
          </span>
        )}
        {queue.etaSec > 0 && <span>təxminən {fmtDuration(queue.etaSec)} qalıb</span>}
      </div>

      {queue.current && (
        <div className="mt-2 text-sm text-gray-500">
          hazırda: <span className="font-mono text-gray-900">{queue.current}</span>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
          Canlı gediş
        </div>
        <LiveFeed feed={queue.feed} />
      </div>
    </div>
  );
}
