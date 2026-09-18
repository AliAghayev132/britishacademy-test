"use client";

// React
import { use, useMemo, useState } from "react";

// Components
import { Pagination, confirmDialog, notify } from "@/components";

// Hooks
import { useDebouncedValue } from "@/hooks";

// Store
import {
  useAdminListQuery,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useAdminReorderMutation,
} from "@/store";

// Lib
import { ADMIN_RESOURCES, ORDERABLE, field, RESOURCE_FILTERS } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { PAGE_SIZE } from "./_components/helpers";
import EditorSwitch from "./_components/EditorSwitch";
import HomeLimitNotice from "./_components/HomeLimitNotice";
import ResourceFilters from "./_components/ResourceFilters";
import ResourceTable from "./_components/ResourceTable";

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

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({}); // { isActive:"true", status:"open", ... }
  const resFilters = RESOURCE_FILTERS[resource] || [];

  // Only send non-empty filter values.
  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null));
  const debouncedSearch = useDebouncedValue(search);
  const listQuery = useAdminListQuery({ resource, search: debouncedSearch || undefined, page, limit: PAGE_SIZE, ...activeFilters });
  const { data } = listQuery;

  const setFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const [updateItem] = useAdminUpdateMutation();
  const [deleteItem] = useAdminDeleteMutation();
  const [reorderItems] = useAdminReorderMutation();

  const [editing, setEditing] = useState(null); // null | {} (new) | item

  const items = useMemo(() => data?.data?.items || [], [data]);
  const pagination = data?.data?.pagination;

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
      notify.error(apiErrorMessage(err, "Silinmədi"));
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

  // ── Sıralama ──
  //
  // Əvvəl sıranı dəyişmək üçün hər elementi tək-tək açıb «Sıra» xanasına
  // rəqəm yazmaq lazım idi — hamısı defolt 0 olduğuna görə praktikada bütün
  // siyahını əl ilə nömrələmək demək idi.
  //
  // AXTARIŞ/SÜZGƏC AKTİV OLANDA OXLAR GİZLƏNİR: ekranda siyahının yalnız bir
  // HİSSƏSİ var, server isə gələn id-lərə ardıcıl nömrə yazır — görünməyən
  // elementlərin sırası səssizcə pozulardı.
  const filtersOn = Boolean(search) || Object.keys(activeFilters).length > 0;
  const canReorder = ORDERABLE.has(resource) && !filtersOn;

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((i) => i._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      // `start` — səhifə sürüşməsi; onsuz 2-ci səhifə də 0-dan nömrələnərdi.
      await reorderItems({ resource, ids, start: (page - 1) * PAGE_SIZE }).unwrap();
    } catch (err) {
      notify.error(apiErrorMessage(err, "Sıra dəyişmədi"));
    }
  };

  const title = cfg?.name || resource;
  const hasFeatured = useMemo(() => items.some((i) => "isFeatured" in i), [items]);

  if (!cfg) return <div className="text-gray-600">Naməlum resurs: {resource}</div>;

  const actions = {
    edit: (item) => setEditing(item || {}),
    remove: removeItem,
    toggleActive,
    toggleFeatured,
    move,
  };

  return (
    <div>
      <ResourceFilters
        search={search}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        resFilters={resFilters}
        filters={filters}
        onFilter={setFilter}
        hasActiveFilters={Object.keys(activeFilters).length > 0}
        onClearFilters={() => { setFilters({}); setPage(1); }}
        onNew={() => setEditing({})}
      />

      {/* Oxlar süzgəc altında gizlənir — səbəbi görünsün ki, düymələr
          «yoxa çıxıb» kimi qalmasın. */}
      {ORDERABLE.has(resource) && filtersOn && (
        <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Sıra oxları yalnız <b>tam siyahıda</b> işləyir — axtarışı və filtrləri
          təmizləyin.
        </div>
      )}

      <HomeLimitNotice resource={resource} items={items} hasFeatured={hasFeatured} />

      <ResourceTable
        query={listQuery}
        items={items}
        page={page}
        cfg={cfg}
        resource={resource}
        canReorder={canReorder}
        hasFeatured={hasFeatured}
        actions={actions}
      />

      <Pagination
        page={pagination?.page || 1}
        pages={pagination?.pages || 1}
        total={pagination?.total}
        onChange={setPage}
      />

      {editing !== null && (
        <EditorSwitch resource={resource} item={editing} title={title} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
