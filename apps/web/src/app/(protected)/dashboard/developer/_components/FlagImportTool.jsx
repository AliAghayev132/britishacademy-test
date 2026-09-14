"use client";

// React
import { useState } from "react";

// Icons
import { Flag } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportFlagsMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice, ReportTable, ReportTitle } from "./shared";

// Bayraqları flagcdn.com-dan endirib qalereyaya yazır və ölkə kartlarına
// bağlayır. `overwrite` — şəkli olan ölkələri də yenilə.
export default function FlagImportTool() {
  const [importFlags, { isLoading: flagging }] = useImportFlagsMutation();
  const [flagReport, setFlagReport] = useState(null);

  const runImportFlags = async (overwrite) => {
    const ok = await confirmDialog({
      title: overwrite ? "Bütün bayraqlar yenilənsin?" : "Bayraqlar endirilsin?",
      text: overwrite
        ? "Şəkli OLAN ölkələrin də bayrağı yenidən endirilib əvəz olunacaq."
        : "Şəkli olmayan ölkələrə flagcdn.com-dan bayraq endirilib «bayraqlar» qovluğuna yazılacaq.",
      confirmText: "Başlat",
    });
    if (!ok) return;
    try {
      const res = await importFlags({ overwrite }).unwrap();
      setFlagReport(res.data);
      notify.success(res.message || "Bayraqlar endirildi");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Bayraq importu alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={Flag}
      iconClass="bg-emerald-50 text-emerald-700"
      title="Ölkə bayraqlarını endir"
      description={
        <>
          «Xaricdə təhsil» ölkə kartlarının şəkli boş olduqda kart emoji bayrağa düşür —
          Windows isə bayraq emojilərini göstərmir, ona görə kartlar boş görünür.
          Bu əməliyyat bayraqları <b>flagcdn.com</b>-dan endirib serverə yazır,
          qalereyada <b>«bayraqlar»</b> qovluğuna qeyd edir və hər ölkənin şəklinə bağlayır.
        </>
      }
    >
      <Notice className="bg-emerald-50 text-emerald-800">
        Fayllar <b>lokala</b> endirilir — sayt kənar CDN-dən asılı qalmır.
        Adi rejim yalnız <b>şəkli olmayan</b> ölkələrə toxunur, təkrar işlədilə bilər.
        Ölkənin adı tanınmasa (ISO kodu tapılmasa) o ölkə ötürülür — şəkli əl ilə yükləyin.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => runImportFlags(false)}
          disabled={flagging}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <Flag className="h-4 w-4" />
          {flagging ? "Endirilir…" : "Bayraqları endir"}
        </button>
        <button onClick={() => runImportFlags(true)} disabled={flagging} className={BTN_OUTLINE}>
          <Flag className="h-4 w-4" /> Hamısını yenilə
        </button>
      </div>

      {flagReport && (
        <div className="mt-6">
          <ReportTitle>
            Nəticə — {flagReport.imported}/{flagReport.total} endirildi, {flagReport.skipped} ötürüldü
          </ReportTitle>
          <ReportTable columns={["Ölkə", "Vəziyyət", "Ölçü"]}>
            {flagReport.report?.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900">{r.country}</td>
                <td className="px-3 py-2 text-gray-600">{r.status}</td>
                <td className="px-3 py-2 text-gray-600">{r.kb ? `${r.kb} KB` : "—"}</td>
              </tr>
            ))}
          </ReportTable>
        </div>
      )}
    </ToolCard>
  );
}
