"use client";

import { use, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
} from "@/store/api/adminApi";
import { ADMIN_RESOURCES, field } from "@/lib/adminResources";

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
  const { data, isLoading, isFetching } = useAdminListQuery({ resource, search: search || undefined, page, limit: 20 });
  const [createItem] = useAdminCreateMutation();
  const [updateItem] = useAdminUpdateMutation();
  const [deleteItem] = useAdminDeleteMutation();

  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const openEditor = (item) => {
    const doc = item ? { ...item } : {};
    // Strip server-managed fields from the editable JSON.
    delete doc._id; delete doc.createdAt; delete doc.updatedAt; delete doc.id;
    delete doc.__v; delete doc.isDeleted;
    setEditing(item || {});
    setJsonText(JSON.stringify(doc, null, 2));
    setJsonError("");
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
    } catch (err) {
      Swal.fire({ icon: "error", title: "Yadda saxlanmadı", text: err?.data?.message || "Xəta baş verdi" });
    }
  };

  const removeItem = async (item) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Silinsin?",
      text: field(item, cfg?.title || "name") || item._id,
      showCancelButton: true,
      confirmButtonText: "Sil",
      cancelButtonText: "İmtina",
      confirmButtonColor: "#E0533D",
    });
    if (!ok.isConfirmed) return;
    try {
      await deleteItem({ resource, id: item._id }).unwrap();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Silinmədi", text: err?.data?.message || "Xəta" });
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateItem({ resource, id: item._id, data: { isActive: !item.isActive } }).unwrap();
    } catch { /* table refetch shows the truth */ }
  };

  const title = cfg?.name || resource;
  const hasActive = useMemo(() => items.some((i) => "isActive" in i), [items]);

  if (!cfg) return <div className="text-gray-600">Naməlum resurs: {resource}</div>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Axtar…"
              className="rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button onClick={() => openEditor(null)} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            <Plus className="h-4 w-4" /> Yeni
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Yüklənir…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Heç nə tapılmadı.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Ad</th>
                <th className="hidden px-4 py-3 md:table-cell">Detal</th>
                {hasActive && <th className="px-4 py-3">Status</th>}
                <th className="px-4 py-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className={isFetching ? "opacity-60" : ""}>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{field(item, cfg.title) || "—"}</td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{String(field(item, cfg.sub) || "").slice(0, 80)}</td>
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
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditor(item)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-100" aria-label="Redaktə et"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => removeItem(item)} className="rounded-lg border border-gray-200 p-2 text-red-500 hover:bg-red-50" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{editing?._id ? "Redaktə et" : "Yeni element"} — {title}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <p className="mb-3 text-xs text-gray-500">
                Sənəd JSON formatında redaktə olunur. Sahə adları üçün mövcud elementlərə bax.
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                className="h-96 w-full rounded-lg border border-gray-200 p-3 font-mono text-xs outline-none focus:border-blue-500"
              />
              {jsonError && <div className="mt-2 text-sm font-semibold text-red-600">{jsonError}</div>}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">İmtina</button>
              <button onClick={save} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
