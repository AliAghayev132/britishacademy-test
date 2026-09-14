"use client";

// React
import { useState } from "react";

// Icons
import { MapPin } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportBranchesMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice, ReportTable, ReportTitle, Warnings } from "./shared";

// Filial əlaqə məlumatları — yalnız filial sətirlərini yeniləyir.
export default function BranchImportTool() {
  const [importBranches, { isLoading: branching }] = useImportBranchesMutation();
  const [branchReport, setBranchReport] = useState(null);

  const runImportBranches = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Filial məlumatları tətbiq olunsun?",
        text: "Dörd filialın <b>ünvanı, telefonu, WhatsApp nömrəsi, xəritə linki və iş saatları</b> müştəri məlumatı ilə əvəz olunacaq. Başqa heç nəyə toxunulmur.",
        confirmText: "Tətbiq et",
      });
      if (!ok) return;
    }
    try {
      const res = await importBranches({ dryRun }).unwrap();
      setBranchReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "İmport alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={MapPin}
      iconClass="bg-teal-50 text-teal-700"
      title="Filial məlumatlarını tətbiq et"
      description={
        <>
          Dörd filialın <b>ünvanı, telefonu, WhatsApp nömrəsi, xəritə linki</b> və
          iş saatları müştəri məlumatı ilə yenilənir. Filial <b>adına görə</b> tapılır.
        </>
      }
    >
      <Notice className="bg-teal-50 text-teal-800">
        Yalnız sadalanan sahələr yazılır — kurslar, müəllimlər və qrafik
        toxunulmur. Təkrar işlədilə bilər. Əvvəlcə <b>«Yoxla»</b> ilə baxın.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImportBranches(true)} disabled={branching} className={BTN_OUTLINE}>
          <MapPin className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runImportBranches(false)}
          disabled={branching}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          <MapPin className="h-4 w-4" />
          {branching ? "Tətbiq olunur…" : "Tətbiq et"}
        </button>
      </div>

      {branchReport && (
        <div className="mt-6">
          <ReportTitle>
            Nəticə — {branchReport.updated} yeniləndi, {branchReport.created} yaradıldı
            {branchReport.dryRun ? " (quru rejim)" : ""}
          </ReportTitle>
          <ReportTable columns={["Filial", "Vəziyyət", "Telefon", "Xəritə"]}>
            {branchReport.report?.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{r.name}</td>
                <td className="px-3 py-2 text-gray-600">{r.status}</td>
                <td className="px-3 py-2 text-gray-600">{r.phone}</td>
                <td className="px-3 py-2 text-gray-600">{r.map}</td>
              </tr>
            ))}
          </ReportTable>
          <Warnings items={branchReport.warnings} />
        </div>
      )}
    </ToolCard>
  );
}
