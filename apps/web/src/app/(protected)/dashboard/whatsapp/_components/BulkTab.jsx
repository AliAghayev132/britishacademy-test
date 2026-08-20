"use client";

// ── Toplu göndəriş tabı ──
// İşləyən növbə varsa gedişat, yoxdursa şablon forması göstərilir.

import { useState } from "react";
import { Loader2, StopCircle, Users } from "lucide-react";
import { input, label, LEAD_STATUSES, fmt } from "./shared";

function Progress({ queue, onCancel }) {
  const done = queue.sent + queue.failed;
  const pct = Math.round((done / (queue.total || 1)) * 100);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Göndəriş davam edir — {done} / {queue.total}
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <StopCircle className="h-4 w-4" /> Dayandır
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {/* Progress hər 3 saniyəlik polling-də sıçrayırdı — yumşaq keçid */}
        <div
          className="h-full rounded-full bg-blue-900 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
        <span className="text-emerald-600">✓ {queue.sent} göndərildi</span>
        <span className="text-red-600">✕ {queue.failed} alınmadı</span>
        {queue.current && <span className="font-mono">→ {queue.current}</span>}
      </div>
    </div>
  );
}

function LastRun({ queue }) {
  if (!queue.finishedAt) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
      <b className="text-gray-900">Son göndəriş:</b>{" "}
      <span className="text-emerald-600">{queue.sent} göndərildi</span>,{" "}
      <span className="text-red-600">{queue.failed} alınmadı</span>{" "}
      <span className="text-gray-400">({fmt(queue.finishedAt)})</span>
      {queue.errors?.length > 0 && (
        <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-gray-500">
          {queue.errors.map((e, i) => (
            <li key={`${e.phone}-${i}`}>
              <span className="font-mono">{e.phone}</span> — {e.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BulkTab({ queue = {}, isReady, onStart, starting }) {
  const [form, setForm] = useState({ template: "", leadStatus: "new", skipDuplicates: true });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {queue.running ? (
        <Progress queue={queue} onCancel={() => onStart(null)} />
      ) : (
        <div className="space-y-4">
          {!isReady && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Toplu göndəriş üçün əvvəlcə «Qoşulma» tabından qoşulun.
            </div>
          )}

          <div>
            <label className={label}>Kimə göndərilsin</label>
            <select
              value={form.leadStatus}
              onChange={(e) => setForm({ ...form, leadStatus: e.target.value })}
              className={input}
            >
              {LEAD_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>Müraciətlər — {o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Mesaj şablonu</label>
            <textarea
              rows={5}
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              placeholder="Salam {{ad}}! British Academy-də yeni qrup açılır…"
              className={`${input} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">
              Dəyişənlər: <span className="font-mono">{"{{ad}}"}</span>,{" "}
              <span className="font-mono">{"{{telefon}}"}</span> — hər müraciətin
              məlumatı ilə əvəzlənir.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.skipDuplicates}
              onChange={(e) => setForm({ ...form, skipDuplicates: e.target.checked })}
              className="h-4 w-4"
            />
            Son 24 saatda mesaj alan nömrələri ötür
          </label>

          <button
            onClick={() => onStart(form)}
            disabled={starting || !isReady || !form.template.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Göndərişi başlat
          </button>

          <LastRun queue={queue} />
        </div>
      )}
    </div>
  );
}
