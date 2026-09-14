"use client";

// React
import { useState } from "react";

// Icons
import { BookOpen } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportPageContentMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, BTN_OVERWRITE, Notice } from "./shared";

export default function PageContentImportTool() {
  const [importPages, { isLoading: paging }] = useImportPageContentMutation();
  const [pageReport, setPageReport] = useState(null);

  // Kurs və ölkə səhifələrinin boş sahələrini doldurur. `dryRun` — yalnız
  // nəyin dolacağını göstərir; `overwrite` — paneldə yazılanı da əvəz edir.
  const runImportPages = async ({ dryRun = false, overwrite = false } = {}) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        tone: overwrite ? "error" : undefined,
        title: overwrite ? "Səhifə mətnləri əvəz olunsun?" : "Səhifələr doldurulsun?",
        text: overwrite
          ? "27 kurs və 12 ölkə səhifəsinin <b>mətni, FAQ-ı, qısa məlumatı və SEO-su tamamilə əvəz olunur</b>. Paneldə etdiyin redaktələr itir."
          : "Yalnız <b>boş sahələr</b> doldurulur — paneldə yazdığın mətn, FAQ və SEO toxunulmur. Qiymət, şəkil və cədvəl dəyişmir.",
        confirmText: overwrite ? "Bəli, əvəz et" : "Doldur",
      });
      if (!ok) return;
    }
    try {
      const res = await importPages({ dryRun, overwrite }).unwrap();
      setPageReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "İmport alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={BookOpen}
      iconClass="bg-sky-50 text-sky-700"
      title="Kurs və ölkə səhifələrini doldur"
      description={
        <>
          Saytdakı <b>27 kurs</b> və <b>12 «Xaricdə təhsil»</b> səhifəsi üçün mətn,
          qısa məlumat cədvəli, FAQ və SEO (meta başlıq, təsvir, açar sözlər).
          Hər sahə ayrıca yoxlanılır və <b>yalnız boşdursa</b> doldurulur.
        </>
      }
    >
      <Notice className="bg-sky-50 text-sky-900">
        Qiymət, müəllim, şəkil, cədvəl və aktivliyə toxunulmur. Mətn
        <b> yalnız azərbaycancadır</b>; EN/RU üçün «AI ilə tərcümə» işlədilir.
        Əvvəlcə «Yoxla» ilə nəyin dolacağına bax.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImportPages({ dryRun: true })} disabled={paging} className={BTN_OUTLINE}>
          Yoxla
        </button>
        <button
          onClick={() => runImportPages()}
          disabled={paging}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          <BookOpen className="h-4 w-4" />
          {paging ? "Doldurulur…" : "Boş sahələri doldur"}
        </button>
        <button onClick={() => runImportPages({ overwrite: true })} disabled={paging} className={BTN_OVERWRITE}>
          Üzərinə yaz
        </button>
      </div>

      {pageReport && (
        <ul className="mt-6 space-y-1 text-sm">
          {pageReport.report.map((r) => (
            <li key={`${r.kind}-${r.slug}`} className="font-mono text-xs text-gray-600">
              {r.kind === "course" ? "kurs" : "ölkə"} · {r.slug} — {r.status}
              {r.fields.length > 0 && <span className="text-gray-400"> ({r.fields.join(", ")})</span>}
            </li>
          ))}
        </ul>
      )}
    </ToolCard>
  );
}
