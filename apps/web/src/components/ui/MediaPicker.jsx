"use client";

// ── Qalereya seçicisi ──
//
// Media kitabxanasından şəkil seçmək üçün modal. Hər yüklənən fayl avtomatik
// qalereyaya düşdüyü üçün (mediaController.uploadImage → registerMedia) admin
// eyni şəkli təkrar yükləmək əvəzinə buradan seçə bilir.
//
// İmkanlar:
//   · qovluq üzrə süzgəc (bayraqlar, ümumi, video…) — say ilə
//   · ad/teq/qovluq üzrə axtarış (server tərəfdə, AZ-tolerant fuzzyRegex ilə)
//   · şəkil şəbəkəsi (grid), seçim, ölçü/tarix məlumatı
//   · səhifələmə
//   · seçilmiş şəklin qovluğunu və teqlərini yerindəcə redaktə etmək
//   · modalın içindən YENİ fayl yükləmək (qalereyaya da düşür)

// React
import { useMemo, useState } from "react";
// UI
import { QueryState } from "./QueryState";
import { notify } from "./feedback";
import {
  X, Search, Upload, Check, FolderOpen, Loader2, Tag, Image as ImageIcon,
} from "lucide-react";
// Data
import {
  useAdminListQuery,
  useMediaFoldersQuery,
  useMediaUpdateMutation,
} from "@/store/api/adminApi";
// Utils
import { getImageUrl } from "@/utils/getImageUrl";
import { uploadWithProgress } from "@/utils/uploadWithProgress";
import { API_URL } from "@/lib/variables";

const PAGE_SIZE = 24;

const fmtKb = (b) => (b ? `${Math.round(b / 1024)} KB` : "—");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("az-AZ") : "");

export function MediaPicker({ onClose, onSelect, defaultFolder = "", fit = "cover" }) {
  const [folder, setFolder] = useState(defaultFolder);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [pct, setPct] = useState(null);
  const [tagDraft, setTagDraft] = useState("");

  const { data: foldersData } = useMediaFoldersQuery();
  const folders = foldersData?.data?.folders || [];

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminListQuery({
    resource: "media",
    page,
    limit: PAGE_SIZE,
    type: "image",
    ...(folder ? { folder } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const [updateMedia, { isLoading: savingMeta }] = useMediaUpdateMutation();

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  const totalAll = useMemo(
    () => folders.reduce((s, f) => s + f.count, 0),
    [folders],
  );

  /** Modalın içindən yeni fayl yüklə — qalereyaya da düşür. */
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPct(0);
    try {
      const fd = new FormData();
      fd.append("image", file);
      // Aktiv qovluq varsa yeni fayl da ora düşsün.
      if (folder) fd.append("folder", folder);
      const res = await uploadWithProgress(`${API_URL}/media/upload-image`, fd, setPct);
      const url = res?.data?.url;
      if (!url) throw new Error("Server URL qaytarmadı");
      notify.success("Yükləndi və qalereyaya əlavə olundu");
      refetch();
      setSelected({ url, filename: url.split("/").pop() });
    } catch (err) {
      notify.error(err?.message || "Yüklənmə alınmadı");
    } finally {
      setPct(null);
      e.target.value = "";
    }
  };

  /** Seçilmiş şəklin qovluq/teqlərini yenilə. */
  const saveMeta = async () => {
    if (!selected?._id) return;
    const tags = tagDraft.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await updateMedia({ id: selected._id, data: { folder: selected.folder, tags } }).unwrap();
      notify.success("Yadda saxlanıldı");
      refetch();
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const pick = (m) => {
    setSelected(m);
    setTagDraft((m.tags || []).join(", "));
  };

  return (
    <div className="ba-fade fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="ba-pop flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Başlıq */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <FolderOpen className="h-4 w-4 text-blue-900" /> Qalereya
            <span className="text-sm font-normal text-gray-400">({totalAll} şəkil)</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-700" aria-label="Bağla">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alət zolağı */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Ad, teq və ya qovluq üzrə axtar…"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
            {pct !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {pct !== null ? `${pct}%` : "Yeni yüklə"}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={pct !== null} />
          </label>
        </div>

        {/* Qovluqlar */}
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-5 py-2.5">
            <button
              onClick={() => { setFolder(""); setPage(1); }}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                !folder ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Hamısı
            </button>
            {folders.map((f) => (
              <button
                key={f.folder}
                onClick={() => { setFolder(f.folder); setPage(1); }}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  folder === f.folder ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.folder} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Şəbəkə + detal */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {isLoading || isError || items.length === 0 ? (
              <QueryState
                isLoading={isLoading}
                isError={isError}
                error={error}
                onRetry={refetch}
                isEmpty={items.length === 0}
                emptyText={
                  search || folder
                    ? "Axtarışa uyğun şəkil tapılmadı."
                    : "Qalereya boşdur — «Yeni yüklə» ilə başlayın."
                }
              />
            ) : (
              <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 ${isFetching ? "opacity-60" : ""}`}>
                {items.map((m) => {
                  const on = selected?._id === m._id || selected?.url === m.url;
                  return (
                    <button
                      key={m._id}
                      onClick={() => pick(m)}
                      onDoubleClick={() => onSelect(m.url)}
                      title={m.filename}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                        on ? "border-blue-900 ring-2 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(m.url)}
                        alt=""
                        loading="lazy"
                        className={`h-full w-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`}
                      />
                      {on && (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-blue-900 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {Array.from({ length: Math.min(pagination.pages, 12) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
                      n === pagination.page
                        ? "bg-blue-900 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detal paneli */}
          {selected && (
            <aside className="w-full flex-none border-t border-gray-100 p-4 md:w-64 md:border-l md:border-t-0">
              <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(selected.url)}
                  alt=""
                  className={`h-full w-full ${fit === "contain" ? "object-contain p-2" : "object-cover"}`}
                />
              </div>
              <p className="mt-2 truncate text-xs text-gray-500" title={selected.filename}>
                {selected.filename}
              </p>
              <p className="text-xs text-gray-400">
                {fmtKb(selected.sizeBytes)}
                {selected.createdAt ? ` · ${fmtDate(selected.createdAt)}` : ""}
              </p>

              {selected._id && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                      Qovluq
                    </label>
                    <input
                      value={selected.folder || ""}
                      onChange={(e) => setSelected({ ...selected, folder: e.target.value })}
                      placeholder="ümumi"
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <Tag className="h-3 w-3" /> Teqlər
                    </label>
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      placeholder="bayraq, avropa"
                      className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={saveMeta}
                    disabled={savingMeta}
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {savingMeta ? "Saxlanılır…" : "Məlumatı yadda saxla"}
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Alt panel */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <span className="text-xs text-gray-400">
            <ImageIcon className="mr-1 inline h-3 w-3" />
            Şəklə iki dəfə klikləməklə də seçə bilərsiniz
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              İmtina
            </button>
            <button
              onClick={() => selected && onSelect(selected.url)}
              disabled={!selected}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Seç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
