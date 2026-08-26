"use client";

// React
import { use, useMemo, useState } from "react";
// Next
import { useRouter, useSearchParams } from "next/navigation";
// Data (RTK Query)
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useAdminLookupsQuery,
} from "@/store/api/adminApi";
// UI / kit
import { confirmDialog, notify } from "@/components/ui/feedback";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { QueryState } from "@/components/ui/QueryState";
import { NativeSelect } from "../../_forms/kit";
// Local
import { BESPOKE_FORMS } from "../../_forms";
// Utils
import { ADMIN_RESOURCES, field, RESOURCE_FILTERS, pickAz, thumbOf, isImagePath } from "@/lib/adminResources";
import { getImageUrl } from "@/utils/getImageUrl";
// Icons
import { Plus, Pencil, Trash2, Search, CalendarClock, X, FileVideo } from "lucide-react";

/**
 * Generic admin resource browser.
 *
 * MVP editor: common fields (ad/başlıq, order, aktivlik) + the full document as
 * editable JSON. Bespoke per-resource forms can replace this screen gradually —
 * the API contract stays the same.
 */
export default function ResourceBrowserPage({ params }) {
  const { resource } = use(params);
  const cfg = ADMIN_RESOURCES[resource];
  const Bespoke = BESPOKE_FORMS[resource]; // purpose-built form, or undefined → JSON editor

  const router = useRouter();
  const searchParams = useSearchParams();
  // "Dərs qrafiki" düyməsindən gələn kurs filtri (?course=<id>) — course-groups üçün.
  const courseParam = searchParams.get("course") || "";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({}); // { isActive:"true", status:"open", ... }
  const resFilters = RESOURCE_FILTERS[resource] || [];

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
  // Only send non-empty filter values.
  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminListQuery({ resource, search: search || undefined, page, limit: 20, ...activeFilters, ...(courseParam ? { course: courseParam } : {}) });

  const setFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const [createItem] = useAdminCreateMutation();
  const [updateItem] = useAdminUpdateMutation();
  const [deleteItem] = useAdminDeleteMutation();

  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [jsonDirty, setJsonDirty] = useState(false);

  const items = data?.data?.items || [];

  // Önizləmə sütunu yalnız siyahıda şəkli olan element varsa göstərilir —
  // filial/FAQ kimi şəkilsiz resurslarda boş sütun yer tutmasın.
  const showThumb = items.some((i) => thumbOf(i));
  const pagination = data?.data?.pagination;

  const openEditor = (item) => {
    const doc = item ? { ...item } : {};
    // Strip server-managed fields from the editable JSON.
    delete doc._id; delete doc.createdAt; delete doc.updatedAt; delete doc.id;
    delete doc.__v; delete doc.isDeleted;
    setEditing(item || {});
    setJsonText(JSON.stringify(doc, null, 2));
    setJsonError("");
    setJsonDirty(false);
  };

  // JSON redaktorunu bağla — dəyişiklik varsa təsdiq istə.
  const closeJsonEditor = async () => {
    if (jsonDirty) {
      const ok = await confirmDialog({
        tone: "warning",
        title: "Çıxılsın?",
        text: "Yadda saxlanılmamış dəyişikliklər var — çıxsanız itəcək.",
        confirmText: "Bəli, çıx",
        cancelText: "Ləğv et",
      });
      if (!ok) return;
    }
    setEditing(null);
  };

  const save = async () => {
    let body;
    try {
      body = JSON.parse(jsonText);
      setJsonError("");
    } catch (e) {
      setJsonError("JSON düzgün deyil: " + e.message);
      return;
    }
    try {
      if (editing?._id) {
        await updateItem({ resource, id: editing._id, data: body }).unwrap();
      } else {
        await createItem({ resource, data: body }).unwrap();
      }
      setEditing(null);
      notify.success("Yadda saxlanıldı");
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const removeItem = async (item) => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Silinsin?",
      text: field(item, cfg?.title || "name") || item._id,
      confirmText: "Sil",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      await deleteItem({ resource, id: item._id }).unwrap();
      notify.success("Silindi");
    } catch (err) {
      notify.error(err?.data?.message || "Silinmədi");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateItem({ resource, id: item._id, data: { isActive: !item.isActive } }).unwrap();
    } catch { /* table refetch shows the truth */ }
  };

  // «Ana səhifədə» açarı. Əvvəl yalnız redaktə formasının içində idi —
  // hansı kursların ana səhifədə göründüyünü görmək üçün hər birini tək-tək
  // açmaq lazım gəlirdi. İndi siyahıdan birbaşa dəyişilir.
  const toggleFeatured = async (item) => {
    try {
      await updateItem({ resource, id: item._id, data: { isFeatured: !item.isFeatured } }).unwrap();
    } catch { /* cədvəl yenidən yüklənəndə həqiqi vəziyyət görünür */ }
  };

  const title = cfg?.name || resource;
  const hasActive = useMemo(() => items.some((i) => "isActive" in i), [items]);
  const hasFeatured = useMemo(() => items.some((i) => "isFeatured" in i), [items]);
  const featuredCount = useMemo(() => items.filter((i) => i.isFeatured).length, [items]);
  // Ana səhifə bölmələrinin göstərdiyi maksimum say (publicController.getHome).
  const HOME_LIMIT = { courses: 6, destinations: 8, testimonials: 6, teachers: 8 }[resource];

  if (!cfg) return <div className="text-gray-600">Naməlum resurs: {resource}</div>;

  return (
    <div>
      {/* Toolbar: axtarış + filtrlər + Yeni yan yana */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Axtar…"
            className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        {resFilters.map((f) => (
          <div key={f.key} className="w-44">
            <NativeSelect placeholder={f.label} options={f.dynamic ? (dynOptions[f.dynamic] || []) : f.options} value={filters[f.key] || ""} onChange={(e) => setFilter(f.key, e.target.value)} />
          </div>
        ))}
        {Object.keys(activeFilters).length > 0 && (
          <button onClick={() => { setFilters({}); setPage(1); }} className="text-sm font-semibold text-gray-500 hover:text-[#00157A]">Filtrləri təmizlə</button>
        )}
        {courseParam && (
          <button onClick={() => router.push(`/dashboard/resurslar/${resource}`)} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#00157A] hover:bg-blue-100">
            <X className="h-3.5 w-3.5" /> Kurs üzrə süzülür
          </button>
        )}
        <button onClick={() => openEditor(null)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> Yeni
        </button>
      </div>

      {/* Ana səhifə seçimi — limiti gizli saxlamamaq üçün açıq göstərilir.
          Seçilmişlərin sayı limitdən çoxdursa artıqları görünməyəcək. */}
      {hasFeatured && HOME_LIMIT ? (
        <div
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            featuredCount > HOME_LIMIT
              ? "bg-amber-50 text-amber-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          Ana səhifədə göstərilir: <b>{Math.min(featuredCount, HOME_LIMIT)}</b> / {HOME_LIMIT}
          {featuredCount > HOME_LIMIT ? (
            <> — <b>{featuredCount}</b> seçilib, artıq olan {featuredCount - HOME_LIMIT}-i görünməyəcək. Sıralama «Sıra» sahəsinə görədir.</>
          ) : (
            <> · Sıralama «Sıra» sahəsinə görədir.</>
          )}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading || isError || items.length === 0 ? (
          <QueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={items.length === 0}
            emptyText={"Heç nə tapılmadı."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {showThumb && <th className="w-16 px-4 py-3">Önizləmə</th>}
                  <th className="px-4 py-3">Ad</th>
                  <th className="hidden px-4 py-3 md:table-cell">Detal</th>
                  {hasFeatured && <th className="px-4 py-3">Ana səhifə</th>}
                  {hasActive && <th className="px-4 py-3">Status</th>}
                  <th className="px-4 py-3 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className={isFetching ? "opacity-60" : ""}>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50">
                    {showThumb && (
                      <td className="px-4 py-3">
                        <Thumb src={thumbOf(item)} />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-gray-900">{field(item, cfg.title) || "—"}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{String(field(item, cfg.sub) || "").slice(0, 80)}</td>
                    {hasFeatured && (
                      <td className="px-4 py-3">
                        {"isFeatured" in item ? (
                          <button
                            onClick={() => toggleFeatured(item)}
                            title={item.isFeatured ? "Ana səhifədən çıxar" : "Ana səhifədə göstər"}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isFeatured ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}
                          >
                            {item.isFeatured ? "Göstərilir" : "Gizli"}
                          </button>
                        ) : null}
                      </td>
                    )}
                    {hasActive && (
                      <td className="px-4 py-3">
                        {"isActive" in item ? (
                          <button
                            onClick={() => toggleActive(item)}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
                          >
                            {item.isActive ? "Aktiv" : "Deaktiv"}
                          </button>
                        ) : null}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <ActionsMenu
                        actions={[
                          { label: "Redaktə", icon: Pencil, onClick: () => openEditor(item) },
                          resource === "courses" && {
                            label: "Dərs qrafiki",
                            icon: CalendarClock,
                            onClick: () => router.push(`/dashboard/resurslar/course-groups?course=${item._id}`),
                          },
                          { label: "Sil", icon: Trash2, tone: "danger", onClick: () => removeItem(item) },
                        ]}
                      />
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

      {/* Bespoke form (teachers / branches / courses) — renders its own modal. */}
      {editing !== null && Bespoke && (
        <Bespoke item={editing} onClose={() => setEditing(null)} />
      )}

      {editing !== null && !Bespoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && closeJsonEditor()}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{editing?._id ? "Redaktə et" : "Yeni element"} — {title}</h2>
              <button onClick={closeJsonEditor} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <p className="mb-3 text-xs text-gray-500">
                Sənəd JSON formatında redaktə olunur. Sahə adları üçün mövcud elementlərə bax.
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setJsonDirty(true); }}
                spellCheck={false}
                className="h-96 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs outline-none focus:border-blue-500"
              />
              {jsonError && <div className="mt-2 text-sm font-semibold text-red-600">{jsonError}</div>}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={closeJsonEditor} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">İmtina</button>
              <button onClick={save} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Cədvəldəki kiçik önizləmə. Şəkil deyilsə (video/sənəd) ikon göstərilir,
 * yüklənmə uğursuz olarsa sınıq şəkil əvəzinə boş çərçivə qalır.
 */
function Thumb({ src }) {
  if (!src) {
    return <div className="h-10 w-10 rounded-lg border border-dashed border-gray-200" />;
  }
  if (!isImagePath(src)) {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400">
        <FileVideo className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={getImageUrl(src)}
      alt=""
      loading="lazy"
      className="h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 object-cover"
      onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
    />
  );
}
