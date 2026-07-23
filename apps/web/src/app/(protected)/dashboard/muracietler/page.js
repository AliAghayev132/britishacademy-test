"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useAdminListQuery, useAdminLeadStatusMutation } from "@/store/api/adminApi";

const STATUS = [
  { key: "new", label: "Yeni", cls: "bg-blue-100 text-blue-700" },
  { key: "contacted", label: "Əlaqə saxlanıldı", cls: "bg-amber-100 text-amber-700" },
  { key: "enrolled", label: "Qeydiyyatdan keçdi", cls: "bg-emerald-100 text-emerald-700" },
  { key: "rejected", label: "İmtina", cls: "bg-gray-200 text-gray-600" },
];

const fmt = (d) => new Date(d).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAdminListQuery({ resource: "leads", page, limit: 20 });
  const [setStatus] = useAdminLeadStatusMutation();

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const change = async (lead, status) => {
    try {
      await setStatus({ id: lead._id, status }).unwrap();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Yenilənmədi", text: err?.data?.message || "Xəta" });
    }
  };

  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-gray-900">Müraciətlər</h1>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Yüklənir…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Hələ müraciət yoxdur.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Ad · Telefon</th>
                <th className="hidden px-4 py-3 lg:table-cell">Maraq</th>
                <th className="hidden px-4 py-3 md:table-cell">Tarix</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-60" : ""}>
              {items.map((l) => {
                const st = STATUS.find((s) => s.key === l.status) || STATUS[0];
                return (
                  <tr key={l._id} className="border-t border-gray-100 align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{l.name}</div>
                      <div className="text-gray-500">{l.phone}{l.email ? ` · ${l.email}` : ""}</div>
                      {l.message && <div className="mt-1 max-w-md text-xs text-gray-400">{l.message.slice(0, 140)}</div>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                      {l.course?.title || l.interest || "—"}
                      {l.branch?.name && <div className="text-xs text-gray-400">{l.branch.name}</div>}
                      <div className="text-xs text-gray-400">{l.source}</div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell">{fmt(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`mb-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
                      <div className="flex flex-wrap gap-1">
                        {STATUS.filter((s) => s.key !== l.status).map((s) => (
                          <button key={s.key} onClick={() => change(l, s.key)} className="rounded border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-100">
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={`h-9 w-9 rounded-lg text-sm font-semibold ${n === pagination.page ? "bg-blue-900 text-white" : "border border-gray-200 bg-white text-gray-600"}`}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
