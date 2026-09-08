"use client";

// ── Əməliyyat jurnalı ──
//
// ƏVVƏL NECƏ İDİ: hər sətir bir cümlə idi — «courses yeniləndi: IELTS».
// Hansı sahənin dəyişdiyi, əvvəlki dəyərin nə olduğu bilinmirdi; girişlər
// yazılmırdı; yaradılan/silinən sənədin məzmunu heç yerdə qalmırdı.
//
// İNDİ: sətirdə QISA xülasə var, tam məzmun isə «Detallar» düyməsi ilə
// modalda açılır. Bu, qəsdəndir — sənədin özünü sətirə yazsaq siyahı
// oxunmaz olardı (çoxdilli obyektlər, massivlər, uzun mətnlər).

// React
import { useState } from "react";
// UI / kit
import { Pagination } from "@/components/ui/Pagination";
import { NativeSelect } from "../_forms/kit";
import { QueryState } from "@/components/ui/QueryState";
import { Modal } from "@/components/ui/Modal";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
// Data (RTK Query)
import { useAdminLogsQuery, useAdminLogFiltersQuery } from "@/store/api/adminApi";
// Icons
import { X, ArrowRight, ShieldAlert, FileSearch } from "lucide-react";

/** Əməliyyat → AZ etiket + rozetka rəngi. */
const ACTIONS = {
  create: { label: "Yaratma", cls: "bg-emerald-100 text-emerald-700" },
  update: { label: "Yeniləmə", cls: "bg-blue-100 text-blue-800" },
  delete: { label: "Silmə", cls: "bg-red-100 text-red-700" },
  status: { label: "Müraciət", cls: "bg-indigo-100 text-indigo-700" },
  reorder: { label: "Sıralama", cls: "bg-slate-200 text-slate-700" },
  settings: { label: "Tənzimləmə", cls: "bg-amber-100 text-amber-700" },
  seed: { label: "Seed", cls: "bg-purple-100 text-purple-700" },
  user: { label: "İstifadəçi", cls: "bg-cyan-100 text-[#00157A]" },
  login: { label: "Giriş", cls: "bg-gray-200 text-gray-700" },
  logout: { label: "Çıxış", cls: "bg-gray-100 text-gray-500" },
};
const actionOf = (a) => ACTIONS[a] || { label: a, cls: "bg-gray-200 text-gray-600" };

const fmt = (d) =>
  new Date(d).toLocaleString("az-AZ", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/**
 * Xam dəyəri modalda göstərmək üçün mətnə çevir.
 *
 * Sadə dəyər olduğu kimi, mürəkkəb dəyər isə səliqəli JSON kimi verilir —
 * çoxdilli sahə və massivlər məhz burada tam görünür.
 */
const pretty = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};

/**
 * Modalda bir sahənin əvvəl/sonra görünüşü.
 *
 * «Əvvəl / Sonra» etiketləri YALNIZ hər iki tərəf olanda göstərilir:
 * yaradılanda və siləndə tək tərəf var, etiket isə hər sahədə təkrarlanıb
 * gözü yorurdu (başlıq onsuz da «yaradıldı»/«silindi» yazır).
 */
function FieldBlock({ name, before, after }) {
  const has = (v) => v !== undefined;
  const both = has(before) && has(after);
  const cell = (label, v, tone) => (
    <div className="bg-white p-3">
      {both && (
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
      )}
      <pre className={`max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs ${tone}`}>
        {pretty(v)}
      </pre>
    </div>
  );
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 font-mono text-xs font-bold text-gray-700">
        {name}
      </div>
      <div className={`grid gap-px bg-gray-100 ${both ? "sm:grid-cols-2" : ""}`}>
        {has(before) && cell("Əvvəl", before, "text-gray-600")}
        {has(after) && cell("Sonra", after, "text-gray-900")}
      </div>
    </div>
  );
}

/** «Detallar» modalı — sənədin tam məzmunu. */
function DetailsModal({ log, onClose }) {
  if (!log) return null;
  const d = log.details || {};
  // Hər iki tərəfin sahələri birləşdirilir: yaradılanda yalnız `after`,
  // siləndə yalnız `before` olur.
  const fields = [...new Set([...Object.keys(d.before || {}), ...Object.keys(d.after || {})])];

  return (
    <Modal isOpen onClose={onClose} size="xl" title={log.summary || "Detallar"}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <span><b className="text-gray-700">{log.actor?.name || "—"}</b>{log.actor?.role ? ` · ${log.actor.role}` : ""}</span>
          <span>{fmt(log.createdAt)}</span>
          {log.resource && <span>{log.resource}</span>}
          {log.ip && <span>IP {log.ip}</span>}
          {log.method && <span className="font-mono">{log.method} {log.path}</span>}
        </div>

        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Bu qeyd üçün saxlanılmış məlumat yoxdur.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <FieldBlock key={f} name={f} before={d.before?.[f]} after={d.after?.[f]} />
            ))}
          </div>
        )}

        {log.userAgent && (
          <p className="break-words text-[11px] text-gray-400">{log.userAgent}</p>
        )}
      </div>
    </Modal>
  );
}

const input =
  "rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  // Bütün süzgəclər tək obyektdə — sıfırlamaq bir sətirdir.
  const [f, setF] = useState({ action: "", resource: "", actor: "", status: "", from: "", to: "", search: "" });
  const [open, setOpen] = useState(null); // modalda göstərilən qeyd

  const put = (k, v) => { setF((prev) => ({ ...prev, [k]: v })); setPage(1); };
  const set = (k) => (e) => put(k, e.target.value);
  const reset = () => { setF({ action: "", resource: "", actor: "", status: "", from: "", to: "", search: "" }); setPage(1); };
  const active = Object.values(f).filter(Boolean).length;

  // Boş dəyərlər sorğuya qoşulmur — server tərəfdə mənasız şərt yaranmasın.
  const params = { page, limit: 30, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) };
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminLogsQuery(params);
  const { data: opts } = useAdminLogFiltersQuery();

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;
  const o = opts?.data || { actors: [], actions: [], resources: [] };

  return (
    <div>
      {/* ── Süzgəclər: TƏK SIRA ──
          Əvvəl iki sıra idi və hər sahə tam enində yer tuturdu. Geniş
          ekranda hamısı bir sıraya sığır, dar ekranda öz-özünə qatlanır. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          className="w-full sm:w-40"
          placeholder="İstifadəçi"
          value={f.actor}
          onChange={set("actor")}
          options={o.actors.map((a) => ({ value: a.id, label: `${a.name} (${a.count})` }))}
        />
        <NativeSelect
          className="w-full sm:w-36"
          placeholder="Əməliyyat"
          value={f.action}
          onChange={set("action")}
          options={o.actions.map((a) => ({ value: a, label: actionOf(a).label }))}
        />
        <NativeSelect
          className="w-full sm:w-36"
          placeholder="Bölmə"
          value={f.resource}
          onChange={set("resource")}
          options={o.resources.map((r) => ({ value: r, label: r }))}
        />
        <NativeSelect
          className="w-full sm:w-32"
          placeholder="Nəticə"
          value={f.status}
          onChange={set("status")}
          options={[{ value: "ok", label: "Uğurlu" }, { value: "fail", label: "Uğursuz" }]}
        />
        {/* Layihənin öz təqvimi — brauzerin `input[type=date]` görünüşü
            əməliyyat sistemindən asılıdır və panelin qalanına oxşamırdı. */}
        <DateRangePicker
          className="w-full sm:w-56"
          from={f.from}
          to={f.to}
          onFrom={(v) => put("from", v)}
          onTo={(v) => put("to", v)}
        />
        <input
          value={f.search}
          onChange={set("search")}
          placeholder="Axtar…"
          className={`${input} min-w-[140px] flex-1`}
        />
        {active > 0 && (
          <button
            onClick={reset}
            title="Süzgəcləri təmizlə"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-[#00157A]"
          >
            <X className="h-3.5 w-3.5" /> {active}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading || isError || items.length === 0 ? (
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={items.length === 0}
            emptyText="Bu süzgəclərə uyğun qeyd yoxdur."
          />
        ) : (
          <ul className={`divide-y divide-gray-100 ${isFetching ? "opacity-60" : ""}`}>
            {items.map((log) => {
              const a = actionOf(log.action);
              const failed = log.status === "fail";
              const hasDetails =
                Boolean(log.details?.before) || Boolean(log.details?.after);
              return (
                <li key={log._id} className={`flex gap-3 px-4 py-3 ${failed ? "bg-red-50/40" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${a.cls}`}>
                        {a.label}
                      </span>
                      {failed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                          <ShieldAlert className="h-3 w-3" /> Uğursuz
                        </span>
                      )}
                      <span className="text-sm font-semibold text-gray-900">{log.summary || "—"}</span>
                      {log.reason && <span className="text-xs text-red-600">· {log.reason}</span>}
                    </div>

                    {/* Sətirdə YALNIZ qısa xülasə — tam məzmun modaldadır. */}
                    {(log.changes || []).length > 0 && (
                      <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                        {log.changes.map((c, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-mono font-semibold text-gray-700">{c.field}</span>
                            <span className="truncate text-gray-400 line-through">{c.from}</span>
                            <ArrowRight className="h-3 w-3 flex-none text-gray-400" />
                            <span className="truncate font-semibold text-gray-900">{c.to}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{log.actor?.name || "—"}</span>
                      {log.actor?.role && <span>{log.actor.role}</span>}
                      {log.resource && <span>· {log.resource}</span>}
                      {log.ip && <span>· {log.ip}</span>}
                    </div>
                  </div>

                  {/* Sağ sütun: vaxt + «Detallar» */}
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <span className="whitespace-nowrap text-xs text-gray-400">{fmt(log.createdAt)}</span>
                    {hasDetails && (
                      <button
                        onClick={() => setOpen(log)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:border-[#00157A] hover:text-[#00157A]"
                      >
                        <FileSearch className="h-3.5 w-3.5" /> Detallar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Pagination
        page={pagination?.page || 1}
        pages={pagination?.pages || 1}
        total={pagination?.total}
        onChange={setPage}
      />

      <DetailsModal log={open} onClose={() => setOpen(null)} />
    </div>
  );
}
