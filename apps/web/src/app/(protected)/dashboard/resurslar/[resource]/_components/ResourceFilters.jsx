"use client";

// React
import { useMemo } from "react";

// Icons
import { Plus, Search } from "lucide-react";

// Store
import { useAdminLookupsQuery } from "@/store";

// Lib
import { pickAz } from "@/lib";

// Local
import { NativeSelect } from "../../../_forms/kit";

/** Toolbar: axtarış + filtrlər + Yeni yan yana. */
export default function ResourceFilters({
  search,
  onSearch,
  resFilters,
  filters,
  onFilter,
  hasActiveFilters,
  onClearFilters,
  onNew,
}) {
  // Dinamik filtr seçimləri (filial/müəllim) — yalnız lazım olduqda çək.
  const needsLookups = resFilters.some((f) => f.dynamic);
  const { data: lookups } = useAdminLookupsQuery(undefined, { skip: !needsLookups });
  const dynOptions = useMemo(() => {
    const lk = lookups?.data || {};
    return {
      // /admin/lookups ADMIN endpointidir — xam { az, en, ru } qaytarır.
      // pickAz olmadan obyekt birbaşa render olunurdu (React #31 çökməsi).
      branches: (lk.branches || []).map((b) => ({ value: b._id, label: pickAz(b.name) })),
      teachers: (lk.teachers || []).map((t) => ({ value: t._id, label: pickAz(t.fullName) })),
      categories: (lk.categories || []).map((c) => ({ value: c._id, label: pickAz(c.name) })),
    };
  }, [lookups]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Axtar…"
          className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
        />
      </div>
      {resFilters.map((f) => (
        <div key={f.key} className="w-44">
          <NativeSelect placeholder={f.label} options={f.dynamic ? (dynOptions[f.dynamic] || []) : f.options} value={filters[f.key] || ""} onChange={(e) => onFilter(f.key, e.target.value)} />
        </div>
      ))}
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="text-sm font-semibold text-gray-500 hover:text-[#00157A]">Filtrləri təmizlə</button>
      )}
      <button onClick={onNew} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
        <Plus className="h-4 w-4" /> Yeni
      </button>
    </div>
  );
}
