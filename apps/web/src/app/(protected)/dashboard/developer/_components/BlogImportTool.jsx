"use client";

// React
import { useState } from "react";

// Icons
import { FileText } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportBlogMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OVERWRITE, Notice } from "./shared";

export default function BlogImportTool() {
  const [importBlog, { isLoading: blogging }] = useImportBlogMutation();
  const [blogReport, setBlogReport] = useState(null);

  // SEO bloq yazılarını yükləyir. Yazılar QARALAMA kimi düşür — mətn
  // yoxlanmadan saytda dərc olunmur.
  // `publish` — yazıları (yoxdursa yaradıb) saytda dərc edir. Mövcud
  // qaralamaların yalnız statusu dəyişir, mətnə toxunulmur.
  const runImportBlog = async ({ overwrite = false, publish = false } = {}) => {
    const ok = await confirmDialog({
      tone: overwrite ? "error" : undefined,
      title: overwrite ? "Bloq yazıları əvəz olunsun?" : publish ? "Bloq yazıları dərc olunsun?" : "Bloq yazıları yüklənsin?",
      text: overwrite
        ? "Mövcud yazıların <b>mətni tamamilə əvəz olunur</b>. Paneldə etdiyin redaktələr itir."
        : publish
          ? "Seed-dəki bütün yazılar <b>saytda dərc olunur</b> (yoxdursa yaradılır). Qaralamaların <b>yalnız statusu</b> dəyişir — mətnə toxunulmur. Özün sonradan qaralamaya qaytardığın yazı da yenidən dərc olunar."
          : "SEO bloq yazıları <b>qaralama</b> kimi yaradılır — saytda dərhal görünmür. <b>Mövcud yazı toxunulmur.</b>",
      confirmText: overwrite ? "Bəli, əvəz et" : publish ? "Dərc et" : "Yüklə",
    });
    if (!ok) return;
    try {
      const res = await importBlog({ overwrite, publish }).unwrap();
      setBlogReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "İmport alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={FileText}
      iconClass="bg-emerald-50 text-emerald-700"
      title="SEO bloq yazılarını yüklə"
      description={
        <>
          Saytda <b>heç bir bloq yazısı yox idi</b>, kurs və ölkə səhifələrinin
          böyük hissəsi isə mətnsizdir — yəni axtarış sistemləri üçün göstəriləcək
          məzmun yoxdur. Bu dəst saytdakı <b>hər kurs və hər ölkə</b> üçün yazı
          yaradır — 5 kateqoriya, 40 yazı: xaricdə təhsil, beynəlxalq imtahanlar,
          dil öyrənmə, karyera və uşaq proqramları.
        </>
      }
    >
      <Notice className="bg-emerald-50 text-emerald-900">
        «Qaralama kimi yüklə» — saytda görünmür, paneldə yoxlayıb özün
        dərc edirsən. «Yüklə və dərc et» — hamısı dərhal saytda görünür;
        artıq yüklənmiş qaralamaları da dərc edir (mətnə toxunmadan).
        Mətn <b>yalnız azərbaycancadır</b>; EN/RU üçün yuxarıdakı
        «AI ilə tərcümə» işlədilir.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => runImportBlog()}
          disabled={blogging}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
        >
          <FileText className="h-4 w-4" />
          Qaralama kimi yüklə
        </button>
        <button
          onClick={() => runImportBlog({ publish: true })}
          disabled={blogging}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <FileText className="h-4 w-4" />
          {blogging ? "Gözlə…" : "Yüklə və dərc et"}
        </button>
        <button onClick={() => runImportBlog({ overwrite: true })} disabled={blogging} className={BTN_OVERWRITE}>
          Üzərinə yaz
        </button>
      </div>

      {blogReport && (
        <ul className="mt-6 space-y-1 text-sm">
          {blogReport.report.posts.map((r) => (
            <li key={r.slug} className="font-mono text-xs text-gray-600">
              {r.slug} — {r.status}
            </li>
          ))}
        </ul>
      )}
    </ToolCard>
  );
}
