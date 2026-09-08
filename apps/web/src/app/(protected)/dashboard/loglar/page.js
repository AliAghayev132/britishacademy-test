"use client";

// ── Əməliyyat jurnalı ──
//
// ƏVVƏL NECƏ İDİ: hər sətir bir cümlə idi — «courses yeniləndi: IELTS».
// Yəni hansı sahənin dəyişdiyi, əvvəlki dəyərin nə olduğu bilinmirdi;
// girişlər ümumiyyətlə yazılmırdı; süzgəc yalnız əməliyyat növü və
// axtarışdan ibarət idi.
//
// İNDİ: hər qeydin altında «nə idi → nə oldu» sətirləri var, girişlər
// (uğurlu və UĞURSUZ) düşür, süzgəc isə istifadəçi, əməliyyat, resurs,
// nəticə və tarix aralığı üzrədir.

// React
import { useState } from "react";
// UI / kit
import { Pagination } from "@/components/ui/Pagination";
import { NativeSelect } from "../_forms/kit";
import { QueryState } from "@/components/ui/QueryState";
// Data (RTK Query)
import { useAdminLogsQuery, useAdminLogFiltersQuery } from "@/store/api/adminApi";
// Icons
import { X, ArrowRight, ShieldAlert } from "lucide-react";

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

const input =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  // Bütün süzgəclər tək obyektdə — sıfırlamaq bir sətirdir.
  const [f, setF] = useState({ action: "", resource: "", actor: "", status: "", from: "", to: "", search: "" });

  const set = (k) => (e) => { setF((prev) => ({ ...prev, [k]: e.target.value })); setPage(1); };
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
      <p className="mb-4 text-sm text-gray-500">
        Kim nə etdi — dəyişikliklər sahə-sahə, girişlər də daxil olmaqla.
      </p>

      {/* ── Süzgəclər ── */}
      <div className="mb-4 space-y-2 rounded-xl border border-gray-200 bg-white p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <NativeSelect
            placeholder="Bütün istifadəçilər"
            value={f.actor}
            onChange={set("actor")}
            options={o.actors.map((a) => ({ value: a.id, label: `${a.name} (${a.count})` }))}
          />
          <NativeSelect
            placeholder="Bütün əməliyyatlar"
            value={f.action}
            onChange={set("action")}
            options={o.actions.map((a) => ({ value: a, label: actionOf(a).label }))}
          />
          <NativeSelect
            placeholder="Bütün bölmələr"
            value={f.resource}
            onChange={set("resource")}
            options={o.resources.map((r) => ({ value: r, label: r }))}
          />
          <NativeSelect
            placeholder="Bütün nəticələr"
            value={f.status}
            onChange={set("status")}
            options={[{ value: "ok", label: "Uğurlu" }, { value: "fail", label: "Uğursuz" }]}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="whitespace-nowrap">Tarixdən</span>
            <input type="date" value={f.from} onChange={set("from")} className={`${input} w-full`} />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="whitespace-nowrap">Tarixə</span>
            <input type="date" value={f.to} onChange={set("to")} className={`${input} w-full`} />
          </label>
          <input
            value={f.search}
            onChange={set("search")}
            placeholder="Təfərrüat, istifadəçi, sahə, IP…"
            className={`${input} w-full lg:col-span-2`}
          />
        </div>

        {active > 0 && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#00157A]"
          >
            <X className="h-3.5 w-3.5" /> Süzgəcləri təmizlə ({active})
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
              return (
                <li key={log._id} className={`px-4 py-3 ${failed ? "bg-red-50/40" : ""}`}>
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
                    <span className="ml-auto whitespace-nowrap text-xs text-gray-400">{fmt(log.createdAt)}</span>
                  </div>

                  {/* «Nə idi → nə oldu» — jurnalın əsas dəyəri budur. */}
                  {(log.changes || []).length > 0 && (
                    <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                      {log.changes.map((c, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-mono font-semibold text-gray-700">{c.field}</span>
                          <span className="text-gray-400 line-through">{c.from}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="font-semibold text-gray-900">{c.to}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{log.actor?.name || "—"}</span>
                    {log.actor?.role && <span>{log.actor.role}</span>}
                    {log.resource && <span>· {log.resource}</span>}
                    {log.ip && <span>· {log.ip}</span>}
                    {log.method && <span className="font-mono">· {log.method} {log.path}</span>}
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
    </div>
  );
}
