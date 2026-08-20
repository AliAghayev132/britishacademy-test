"use client";

// React
import { useState } from "react";
// UI / kit
import { NativeSelect } from "../_forms/kit";
// Data (RTK Query)
import { useAdminLogsQuery } from "@/store/api/adminApi";
import { QueryState } from "@/components/ui/QueryState";

// action → AZ label + badge colors (navy-leaning palette)
const ACTIONS = {
  create: { label: "Yaratma", cls: "bg-emerald-100 text-emerald-700" },
  update: { label: "Yeniləmə", cls: "bg-blue-100 text-blue-800" },
  delete: { label: "Silmə", cls: "bg-red-100 text-red-700" },
  settings: { label: "Tənzimləmə", cls: "bg-amber-100 text-amber-700" },
  seed: { label: "Seed", cls: "bg-purple-100 text-purple-700" },
  user: { label: "İstifadəçi", cls: "bg-cyan-100 text-[#00157A]" },
  login: { label: "Giriş", cls: "bg-gray-200 text-gray-600" },
};

// filter dropdown options
const ACTION_OPTIONS = [
  { value: "", label: "Bütün əməliyyatlar" },
  { value: "create", label: "Yaratma" },
  { value: "update", label: "Yeniləmə" },
  { value: "delete", label: "Silmə" },
  { value: "settings", label: "Tənzimləmə" },
  { value: "seed", label: "Seed" },
  { value: "user", label: "İstifadəçi" },
];

const fmt = (d) => new Date(d).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminLogsQuery({ page, action, search });

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const onAction = (e) => { setAction(e.target.value); setPage(1); };
  const onSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div>
      <p className="mb-5 text-sm text-gray-500">Əməliyyat tarixçəsi</p>

      {/* Filter bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <NativeSelect
          options={ACTION_OPTIONS}
          value={action}
          onChange={onAction}
          className="sm:w-56"
        />
        <input
          value={search}
          onChange={onSearch}
          placeholder="Təfərrüat və ya istifadəçi üzrə axtar…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading || isError || items.length === 0 ? (
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={items.length === 0}
            emptyText={"Hələ log yoxdur."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tarix</th>
                  <th className="px-4 py-3">İstifadəçi</th>
                  <th className="px-4 py-3">Əməliyyat</th>
                  <th className="hidden px-4 py-3 md:table-cell">Resurs</th>
                  <th className="px-4 py-3">Təfərrüat</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {items.map((log) => {
                  const a = ACTIONS[log.action] || { label: log.action, cls: "bg-gray-200 text-gray-600" };
                  return (
                    <tr key={log._id} className="border-t border-gray-100 align-top hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmt(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{log.actor?.name || "—"}</div>
                        {log.actor?.role && <div className="text-xs text-gray-400">{log.actor.role}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${a.cls}`}>{a.label}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{log.resource || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{log.summary || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${n === pagination.page ? "bg-[#00157A] text-white" : "border border-gray-200 bg-white text-gray-600"}`}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
