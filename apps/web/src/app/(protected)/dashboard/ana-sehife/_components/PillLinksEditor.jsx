"use client";

// Icons
import { ArrowDown, ArrowUp } from "lucide-react";

// Utils
import { rowKey } from "@/utils";

// Local
import { LocalizedInput, toLoc } from "../../_forms/Localized";
import { input, label } from "./shared";

/** Hero-nun linkli düymələri — sıra saytda görünən ardıcıllıqdır. */
export function PillLinksEditor({ form, set }) {
  /**
   * Hero düyməsinin sırasını dəyiş.
   *
   * Sıra SAYTDA GÖRÜNƏN ardıcıllıqdır — ən çox satılan kursu əvvələ çəkmək
   * üçün düyməni silib yenidən yazmaq lazım gəlmirdi. `move` (bölmələr üçün)
   * ilə eyni məntiq, amma o, ayrıca `rows` vəziyyəti üzərində işləyir.
   */
  const movePill = (index, dir) => {
    const list = [...(form.hero.pillLinks || [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    set("hero.pillLinks", list);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:col-span-2">
      <div className="mb-1 flex items-center justify-between">
        <label className={label}>Hero düymələri — link ilə</label>
        <button
          onClick={() =>
            set("hero.pillLinks", [...(form.hero.pillLinks || []), { _key: rowKey(), label: toLoc(""), href: "" }])
          }
          className="rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-700"
        >
          + Düymə
        </button>
      </div>
      <p className="mb-3 text-xs text-gray-400">
        Hər düymənin öz ünvanı olur. Ünvan boş qalsa həmin düymə kurslar
        bölməsinə sürüşdürür. Sıra saytda göründüyü ardıcıllıqdır — ox
        düymələri ilə dəyişdirin.
      </p>

      {(form.hero.pillLinks || []).length === 0 && (
        <p className="text-sm text-gray-400">Düymə əlavə edilməyib — yuxarıdakı mətn siyahısı işlənəcək.</p>
      )}
      <div className="space-y-3">
        {(form.hero.pillLinks || []).map((row, i) => (
          <div key={row._key} className="flex items-start gap-3">
            {/* Sıra — saytda göründüyü ardıcıllıq */}
            <div className="mt-6 flex flex-none flex-col">
              <button
                onClick={() => movePill(i, -1)}
                disabled={i === 0}
                aria-label="Yuxarı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => movePill(i, 1)}
                disabled={i === (form.hero.pillLinks || []).length - 1}
                aria-label="Aşağı"
                className="grid h-6 w-6 place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="mt-7 grid h-6 w-6 flex-none place-items-center rounded-md bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </span>
            <div className="flex-1">
              <label className={label}>Yazı (3 dildə)</label>
              <LocalizedInput
                value={row.label}
                onChange={(v) => set(`hero.pillLinks.${i}.label`, v)}
                placeholder="IELTS"
              />
            </div>
            <div className="flex-1">
              <label className={label}>Ünvan</label>
              <input
                className={input}
                value={row.href}
                onChange={(e) => set(`hero.pillLinks.${i}.href`, e.target.value)}
                placeholder="/kurslar/ielts-kurslari"
              />
              <p className="mt-1 text-xs text-gray-400">
                Saytdaxili yol («/kurslar/…»), lövbər («#kurslar») və ya tam link.
              </p>
            </div>
            <button
              onClick={() =>
                set("hero.pillLinks", form.hero.pillLinks.filter((_, j) => j !== i))
              }
              className="mt-6 rounded-lg border border-gray-200 p-2 text-red-500 hover:bg-red-50"
              aria-label="Sil"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
