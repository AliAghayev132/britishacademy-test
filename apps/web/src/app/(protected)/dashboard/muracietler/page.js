"use client";

// React
import { useState } from "react";
// UI / kit
import { notify } from "@/components/ui/feedback";
import { NativeSelect } from "../_forms/kit";
import { DatePicker } from "@/components/ui/DatePicker";
import { Pagination } from "@/components/ui/Pagination";
// Data (RTK Query)
import { useAdminListQuery, useAdminLeadStatusMutation, useAdminLookupsQuery } from "@/store/api/adminApi";
import { QueryState } from "@/components/ui/QueryState";
import { pickAz } from "@/lib/adminResources";
// Icons
import { Search, X } from "lucide-react";

const STATUS = [
  { key: "new", label: "Yeni", cls: "bg-blue-100 text-blue-700", color: "#2563EB" },
  { key: "contacted", label: "Əlaqə saxlanıldı", cls: "bg-amber-100 text-amber-700", color: "#D97706" },
  { key: "enrolled", label: "Qeydiyyatdan keçdi", cls: "bg-emerald-100 text-emerald-700", color: "#059669" },
  { key: "rejected", label: "İmtina", cls: "bg-gray-200 text-gray-600", color: "#6B7280" },
];
const STATUS_OPTIONS = STATUS.map((s) => ({ value: s.key, label: s.label, color: s.color }));
const STATUS_BY_KEY = Object.fromEntries(STATUS.map((s) => [s.key, s]));

const SOURCE_OPTIONS = [
  { value: "apply-modal", label: "Müraciət formu" },
  { value: "contact-page", label: "Əlaqə səhifəsi" },
  { value: "course-page", label: "Kurs səhifəsi" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Telefon" },
  { value: "other", label: "Digər" },
];
const SOURCE_LABEL = Object.fromEntries(SOURCE_OPTIONS.map((s) => [s.value, s.label]));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
/** «Xaricdə təhsil» maraq dəyəri — müraciətdə AZ yazılır (bax ApplyModal). */
const ABROAD_INTEREST = "Xaricdə təhsil";

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });

/** Telefonu wa.me üçün rəqəmlərə çevir. */
const waNumber = (phone) => String(phone || "").replace(/[^\d]/g, "");

/**
 * Müraciətlər siyahısı.
 *
 * `abroadOnly` — yalnız xaricdə təhsil müraciətləri. Sidebar-da ayrıca bənd
 * var və o, bu komponenti həmin bayraqla render edir; siyahı, filtrlər və
 * əməliyyatlar eynidir, ona görə ayrı səhifə yazmaq təkrar olardı.
 */
export function LeadsView({ abroadOnly = false }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("");
  const [source, setSource] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Filial və kurs siyahıları — filtr üçün.
  const { data: lookups } = useAdminLookupsQuery();
  const branchOptions = (lookups?.data?.branches || []).map((b) => ({
    value: b._id,
    label: pickAz(b.name),
  }));
  const courseOptions = (lookups?.data?.courses || []).map((c) => ({
    value: c._id,
    label: pickAz(c.title),
  }));

  // Ölkə siyahısı lookups-dan gəlir; boşdursa filtr ümumiyyətlə göstərilmir.
  const destinationOptions = (lookups?.data?.destinations || []).map((d) => ({
    value: d._id,
    label: pickAz(d.country),
  }));

  const activeFilters = {
    // Xaricdə təhsil bölməsində maraq növü SABİT süzgəcdir — istifadəçi onu
    // dəyişə bilmir, ona görə filtr panelində göstərilmir.
    ...(abroadOnly ? { interest: ABROAD_INTEREST } : {}),
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(branch ? { branch } : {}),
    ...(course ? { course } : {}),
    ...(destination ? { destinations: destination } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const hasFilter = Boolean(search || status || source || branch || course || destination || from || to);

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

  // Hər filtr dəyişikliyi 1-ci səhifəyə qaytarır — əks halda 5-ci səhifədə
  // filtr seçəndə boş nəticə görünürdü.
  const setFilter = (setter) => (v) => {
    setter(v);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSource("");
    setBranch("");
    setCourse("");
    setDestination("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div>
      {/* ── Filtrlər ── iki sıra: axtarış + seçimlər, sonra tarix aralığı */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setFilter(setSearch)(e.target.value)}
              placeholder="Ad, telefon və ya e-poçt…"
              className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-44">
            <NativeSelect
              placeholder="Bütün statuslar"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setFilter(setStatusFilter)(e.target.value)}
            />
          </div>
          <div className="w-44">
            <NativeSelect
              placeholder="Bütün mənbələr"
              options={SOURCE_OPTIONS}
              value={source}
              onChange={(e) => setFilter(setSource)(e.target.value)}
            />
          </div>
          {/* Xaricdə təhsil müraciətlərində filial olmur — filtr gizlənir. */}
          {!abroadOnly && (
          <div className="w-48">
            <NativeSelect
              placeholder="Bütün filiallar"
              options={branchOptions}
              value={branch}
              onChange={(e) => setFilter(setBranch)(e.target.value)}
            />
          </div>
          )}
          {/* Kurs da eyni səbəbdən gizlənir — müraciət ölkə üzrədir. */}
          {!abroadOnly && (
          <div className="w-52">
            <NativeSelect
              placeholder="Bütün kurslar"
              options={courseOptions}
              value={course}
              onChange={(e) => setFilter(setCourse)(e.target.value)}
            />
          </div>
          )}
            {destinationOptions.length > 0 && (
              <div className="w-52">
                <NativeSelect
                  placeholder="Bütün ölkələr"
                  options={destinationOptions}
                  value={destination}
                  onChange={(e) => setFilter(setDestination)(e.target.value)}
                />
              </div>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tarix</span>
          <div className="w-44">
            <DatePicker value={from} onChange={setFilter(setFrom)} placeholder="Başlanğıc" max={to || undefined} />
          </div>
          <span className="text-gray-300">—</span>
          <div className="w-44">
            <DatePicker value={to} onChange={setFilter(setTo)} placeholder="Son" min={from || undefined} />
          </div>

          {hasFilter && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-500 transition hover:border-gray-300 hover:text-[#00157A]"
            >
              <X className="h-3.5 w-3.5" /> Filtrləri təmizlə
            </button>
          )}
        </div>
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
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">Əlaqə</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Kurs / maraq</th>
                  {!abroadOnly && <th className="hidden px-4 py-3 xl:table-cell">Filial</th>}
                  <th className="hidden px-4 py-3 lg:table-cell">Mənbə</th>
                  <th className="hidden px-4 py-3 md:table-cell">Tarix</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {items.map((l) => (
                  <tr key={l._id} className="border-t border-gray-100 align-top hover:bg-gray-50">
                    {/* Ad + qeyd */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{l.name}</div>
                      {l.message && (
                        <div className="mt-1 max-w-xs text-xs text-gray-400" title={l.message}>
                          {l.message.length > 90 ? `${l.message.slice(0, 90)}…` : l.message}
                        </div>
                      )}
                    </td>

                    {/* Əlaqə — telefon və e-poçt ayrı sətirdə, kliklənə bilən */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {l.phone && (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${l.phone}`} className="font-medium text-gray-700 hover:text-[#00157A]">
                            {l.phone}
                          </a>
                          <a
                            href={`https://wa.me/${waNumber(l.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp-da yaz"
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            WA
                          </a>
                        </div>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="block text-xs text-gray-500 hover:text-[#00157A]">
                          {l.email}
                        </a>
                      )}
                    </td>

                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                      {pickAz(l.course?.title) || pickAz(l.interest) || "—"}
                      {/* Xaricdə təhsil müraciətlərində seçilən ölkələr — operator
                          ilk zəngdən əvvəl hansı istiqamətdən danışacağını bilsin. */}
                      {l.destinations?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {l.destinations.map((d) => (
                            <span
                              key={d._id || d}
                              className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700"
                            >
                              {pickAz(d.country) || "—"}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {!abroadOnly && (
                    <td className="hidden px-4 py-3 text-gray-600 xl:table-cell">
                      {pickAz(l.branch?.name) || "—"}
                    </td>
                    )}

                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {SOURCE_LABEL[l.source] || l.source || "—"}
                      </span>
                    </td>

                    {/* Tarix və saat ayrı sətirdə — cədvəl daha oxunaqlı olur */}
                    <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                      <div className="text-gray-700">{fmtDate(l.createdAt)}</div>
                      <div className="text-xs text-gray-400">{fmtTime(l.createdAt)}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="w-44">
                        <NativeSelect
                          options={STATUS_OPTIONS}
                          value={l.status}
                          onChange={(e) => change(l, e.target.value)}
                        />
                      </div>
                      {l.handledBy && (
                        <div className="mt-1 text-xs text-gray-400">
                          {l.handledBy.firstName} {l.handledBy.lastName}
                        </div>
                      )}
                      {l.status && STATUS_BY_KEY[l.status] && l.handledAt && (
                        <div className="text-xs text-gray-400">{fmtDate(l.handledAt)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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


export default function LeadsPage() {
  return <LeadsView />;
}