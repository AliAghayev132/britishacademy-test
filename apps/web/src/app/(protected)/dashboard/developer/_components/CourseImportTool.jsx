"use client";

// React
import { useState } from "react";

// Icons
import { BookOpen } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminImportCoursesMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice, ReportTable, ReportTitle, Warnings } from "./shared";

// Müştəri kurs məlumatlarını tətbiq et (dryRun=true → yalnız yoxlama).
export default function CourseImportTool() {
  const [importCourses, { isLoading: importing }] = useAdminImportCoursesMutation();
  const [importReport, setImportReport] = useState(null);

  const runImport = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        tone: "warning",
        title: "Kurs məlumatları tətbiq olunsun?",
        text: "MS Office, İngilis dili, Rus dili və IELTS kurslarının <b>təsviri, məzmunu, SEO mətnləri və qiymət matrisi</b> müştəri məlumatları ilə əvəzlənəcək.<br><br>Şəkil, sıra və dərs qrafikinə toxunulmur.",
        confirmText: "Bəli, tətbiq et",
        cancelText: "İmtina",
      });
      if (!ok) return;
    }
    try {
      const res = await importCourses({ dryRun }).unwrap();
      setImportReport(res?.data || null);
      notify.success(res?.message || "Tamamlandı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={BookOpen}
      iconClass="bg-sky-50 text-sky-700"
      title="Kurs məlumatlarını tətbiq et"
      description={
        <>
          Müştəridən gələn məlumatları (<b>MS Office, İngilis dili, Rus dili, IELTS</b>)
          mövcud kurslara yazır: <b>3 dildə</b> təsvir və məzmun, «Qısa məlumat» kartı,
          <b> SEO</b> mətnləri və <b>filial üzrə qiymət matrisi</b> (qrup/fərdi ×
          gündüz/axşam + qeyd).
        </>
      }
    >
      <Notice className="bg-sky-50 text-sky-800">
        Yalnız sadalanan sahələr yazılır — şəkil, sıra, aktivlik və dərs qrafikinə
        toxunulmur. Təkrar işlədilə bilər (idempotent). Əvvəlcə <b>«Yoxla»</b> ilə
        nəyin dəyişəcəyini görün.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImport(true)} disabled={importing} className={BTN_OUTLINE}>
          <BookOpen className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runImport(false)}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          <BookOpen className="h-4 w-4" />
          {importing ? "Tətbiq olunur…" : "Tətbiq et"}
        </button>
      </div>

      {importReport && (
        <div className="mt-6">
          <ReportTitle>Nəticə</ReportTitle>
          <ReportTable columns={["Kurs", "Vəziyyət", "Qiymət sətri"]}>
            {importReport.report?.map((r) => (
              <tr key={r.slug} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono text-gray-900">{r.slug}</td>
                <td className="px-3 py-2 text-gray-600">{r.status}</td>
                <td className="px-3 py-2 text-gray-600">{r.priceRows ?? "—"}</td>
              </tr>
            ))}
          </ReportTable>
          <Warnings items={importReport.warnings} />
        </div>
      )}
    </ToolCard>
  );
}
