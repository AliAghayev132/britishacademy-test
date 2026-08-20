"use client";

// React
import { useState } from "react";
// UI / kit
import { notify } from "@/components/ui/feedback";
import { NativeSelect } from "../_forms/kit";
// Data (RTK Query)
import { useAdminListQuery, useAdminLeadStatusMutation } from "@/store/api/adminApi";
import { QueryState } from "@/components/ui/QueryState";
// Icons
import { Search } from "lucide-react";

const STATUS = [
  { key: "new", label: "Yeni", cls: "bg-blue-100 text-blue-700", color: "#2563EB" },
  { key: "contacted", label: "Əlaqə saxlanıldı", cls: "bg-amber-100 text-amber-700", color: "#D97706" },
  { key: "enrolled", label: "Qeydiyyatdan keçdi", cls: "bg-emerald-100 text-emerald-700", color: "#059669" },
  { key: "rejected", label: "İmtina", cls: "bg-gray-200 text-gray-600", color: "#6B7280" },
];
const STATUS_OPTIONS = STATUS.map((s) => ({ value: s.key, label: s.label, color: s.color }));

const SOURCE_OPTIONS = [
  { value: "apply-modal", label: "Müraciət formu" },
  { value: "contact-page", label: "Əlaqə səhifəsi" },
  { value: "course-page", label: "Kurs səhifəsi" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Digər" },
];
const SOURCE_LABEL = Object.fromEntries(SOURCE_OPTIONS.map((s) => [s.value, s.label]));

const fmt = (d) => new Date(d).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("");
  const [source, setSource] = useState("");

  const activeFilters = {
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
  };
  const hasFilter = Boolean(search || status || source);

  // Backend leads-i həmişə createdAt: -1 (ən yenilər ən yuxarıda) qaytarır.
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminListQuery({
    resource: "leads",
    page,
    limit: 20,
    search: search || undefined,
    ...activeFilters,
  });
  const [setStatus] = useAdminLeadStatusMutation();

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const change = async (lead, next) => {
    try {
      await setStatus({ id: lead._id, status: next }).unwrap();
    } catch (err) {
      notify.error(err?.data?.message || "Yenilənmədi");
    }
  };

  const resetFilters = () => { setSearch(""); setStatusFilter(""); setSource(""); setPage(1); };

  return (
    <div>
      {/* Toolbar: axtarış + filtrlər yan yana */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Ad, telefon və ya e-poçt…"
            className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="w-44">
          <NativeSelect placeholder="Bütün statuslar" options={STATUS_OPTIONS} value={status} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} />
        </div>
        <div className="w-48">
          <NativeSelect placeholder="Bütün mənbələr" options={SOURCE_OPTIONS} value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} />
        </div>
        {hasFilter && (
          <button onClick={resetFilters} className="text-sm font-semibold text-gray-500 hover:text-[#00157A]">Filtrləri təmizlə</button>
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
            emptyText={hasFilter ? "Axtarışa uyğun müraciət tapılmadı." : "Hələ müraciət yoxdur."}
          />
        ) : (
          <div className="overflow-x-auto">
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
                {items.map((l) => (
                  <tr key={l._id} className="border-t border-gray-100 align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{l.name}</div>
                      <div className="text-gray-500">{l.phone}{l.email ? ` · ${l.email}` : ""}</div>
                      {l.message && <div className="mt-1 max-w-md text-xs text-gray-400">{l.message.slice(0, 140)}</div>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                      {l.course?.title || l.interest || "—"}
                      {l.branch?.name && <div className="text-xs text-gray-400">{l.branch.name}</div>}
                      <div className="text-xs text-gray-400">{SOURCE_LABEL[l.source] || l.source}</div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-gray-500 md:table-cell">{fmt(l.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="w-44">
                        <NativeSelect
                          options={STATUS_OPTIONS}
                          value={l.status}
                          onChange={(e) => change(l, e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
          </div>
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
