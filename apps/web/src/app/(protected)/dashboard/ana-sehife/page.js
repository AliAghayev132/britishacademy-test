"use client";

// React
import { useEffect, useState } from "react";
// Next
import Link from "next/link";
// Data
import { useAdminGetSettingsQuery, useAdminUpdateSettingsMutation } from "@/store/api/adminApi";
// UI
import { notify } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/QueryState";
import { HOME_SECTIONS, resolveSections } from "@/lib/homeSections";
// Icons
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Lock, Save } from "lucide-react";

/**
 * Ana səhifə idarəetməsi.
 *
 * Əvvəl ana səhifədəki məzmun beş ayrı yerdən idarə olunurdu: hero və lent
 * Tənzimləmələrdə, kurslar/ölkələr/rəylər isə öz resurs siyahılarında
 * «isFeatured» açarı ilə. Hansı bölmənin ümumiyyətlə göründüyünü isə heç
 * yerdən dəyişmək olmurdu — bunun üçün deploy lazım gəlirdi.
 *
 * Bu səhifə hamısını bir yerə toplayır: bölməni gizlət/göstər, sırasını
 * dəyiş və məzmununu idarə edən səhifəyə keç.
 */
export default function HomePage() {
  const { data, isLoading, isError, error, refetch } = useAdminGetSettingsQuery();
  const [update, { isLoading: saving }] = useAdminUpdateSettingsMutation();

  const [rows, setRows] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Serverdən gələn konfiqi tam siyahıya çevir (boş = hamısı açıq).
  useEffect(() => {
    const s = data?.data?.settings;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- serverdən gələn konfiqi bir dəfə forma vəziyyətinə köçürür (mount deyil, data gəlişi)
    if (s && !rows) setRows(resolveSections(s.homeSections));
  }, [data, rows]);

  if (isLoading || isError || !rows) {
    return (
      <QueryState
        isLoading={isLoading || !rows}
        isError={isError}
        error={error}
        onRetry={refetch}
      />
    );
  }

  const toggle = (key) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r)));
    setDirty(true);
  };

  const move = (index, dir) => {
    const next = [...rows];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setDirty(true);
  };

  const save = async () => {
    try {
      await update({
        homeSections: rows.map((r) => ({ key: r.key, enabled: r.enabled })),
      }).unwrap();
      notify.success("Ana səhifə yeniləndi");
      setDirty(false);
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const visible = rows.filter((r) => r.enabled).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Ana səhifədə <b className="text-gray-900">{visible}</b> / {rows.length} bölmə görünür.
          Sıranı oxlarla dəyişin.
        </p>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001d9e] disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saxlanılır…" : dirty ? "Yadda saxla" : "Dəyişiklik yoxdur"}
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className={`flex items-start gap-3 rounded-xl border p-4 transition ${
              r.enabled ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50"
            }`}
          >
            {/* Sıra */}
            <div className="flex flex-col gap-0.5 pt-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Yuxarı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label="Aşağı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="mt-1 grid h-6 w-6 flex-none place-items-center rounded-md bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${r.enabled ? "text-gray-900" : "text-gray-400"}`}>
                  {r.label}
                </span>
                {r.locked && (
                  <span title="Bu bölmə gizlədilə bilməz" className="text-gray-300">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
                {r.limit && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                    maks. {r.limit}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{r.hint}</p>
              {r.manage && (
                <Link
                  href={r.manage}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#00157A] hover:underline"
                >
                  Məzmunu idarə et <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Göstər / gizlət */}
            <button
              onClick={() => toggle(r.key)}
              disabled={r.locked}
              title={r.locked ? "Bu bölmə həmişə göstərilir" : r.enabled ? "Gizlət" : "Göstər"}
              className={`inline-flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                r.locked
                  ? "cursor-not-allowed border-gray-100 text-gray-300"
                  : r.enabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {r.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {r.enabled ? "Görünür" : "Gizli"}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Qeyd: məzmunu olmayan bölmə (məsələn heç bir tərəfdaş əlavə edilməyibsə)
        açıq olsa da göstərilmir — boş başlıq görünməsin deyə.
      </p>
    </div>
  );
}
