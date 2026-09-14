"use client";

// React
import { useState } from "react";

// Icons
import { GraduationCap } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportTeachersMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice, ReportTable, ReportTitle, Warnings } from "./shared";

// Müəllim → filial → dərs təyinatları. Dərs saatı yazılmır.
export default function TeacherImportTool() {
  const [importTeachers, { isLoading: teaching }] = useImportTeachersMutation();
  const [teacherReport, setTeacherReport] = useState(null);

  const runImportTeachers = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Müəllim təyinatları tətbiq olunsun?",
        text:
          "Siyahıdakı müəllimlər bazaya yazılacaq: mövcud olanlar adına görə tapılıb yenilənəcək, olmayanlar yaradılacaq. Mövcud filial/dərs təyinatları əvəz olunur.",
        confirmText: "Tətbiq et",
      });
      if (!ok) return;
    }
    try {
      const res = await importTeachers({ dryRun }).unwrap();
      setTeacherReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "İmport alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={GraduationCap}
      iconClass="bg-violet-50 text-violet-700"
      title="Müəllim təyinatlarını tətbiq et"
      description={
        <>
          Müştəridən gələn siyahını yazır: <b>hansı müəllim, hansı filialda, hansı dərsi</b> keçir.
          Mövcud müəllim adına görə tapılır, olmayan yaradılır.
          <b> Dərs saatı yazılmır</b> — müəllim səhifəsi vaxt cədvəli saxlamır.
        </>
      }
    >
      <Notice className="bg-violet-50 text-violet-800">
        Təkrar işlədilə bilər (idempotent). Bazada uyğunluğu olmayan kurslar
        (məsələn <b>Cambridge English</b>, <b>Aptis</b>) ötürülür və nəticədə
        xəbərdarlıq kimi göstərilir. Əvvəlcə <b>«Yoxla»</b> ilə baxın.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImportTeachers(true)} disabled={teaching} className={BTN_OUTLINE}>
          <GraduationCap className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runImportTeachers(false)}
          disabled={teaching}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          <GraduationCap className="h-4 w-4" />
          {teaching ? "Tətbiq olunur…" : "Tətbiq et"}
        </button>
      </div>

      {teacherReport && (
        <div className="mt-6">
          <ReportTitle>
            Nəticə — {teacherReport.created} yaradıldı, {teacherReport.updated} yeniləndi
            {teacherReport.dryRun ? " (quru rejim)" : ""}
          </ReportTitle>
          <ReportTable columns={["Müəllim", "Filial", "Dərslər"]} scroll>
            {teacherReport.report?.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                <td className="px-3 py-2 text-gray-600">{r.branches}</td>
                <td className="px-3 py-2 text-gray-600">{r.courses}</td>
              </tr>
            ))}
          </ReportTable>
          <Warnings items={teacherReport.warnings} />
        </div>
      )}
    </ToolCard>
  );
}
