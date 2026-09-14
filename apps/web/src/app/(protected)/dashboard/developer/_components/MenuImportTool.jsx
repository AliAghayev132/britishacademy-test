"use client";

// React
import { useState } from "react";

// Icons
import { Menu as MenuIcon } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportMenuMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice, ReportTitle } from "./shared";

// Menyu quruluşu dəyişəndə tam seed işlətməmək üçün — yalnız header menyusu.
export default function MenuImportTool() {
  const [importMenu, { isLoading: menuing }] = useImportMenuMutation();
  const [menuReport, setMenuReport] = useState(null);

  const runImportMenu = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Başlıq menyusu yenidən qurulsun?",
        text: "Header menyusu <b>tamamilə silinib</b> yenidən yaradılacaq (Haqqımızda → Müəllimlər, Tələbələrimiz). Footer menyusu və qalan məzmun toxunulmur.",
        confirmText: "Yenidən qur",
      });
      if (!ok) return;
    }
    try {
      const res = await importMenu({ dryRun }).unwrap();
      setMenuReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={MenuIcon}
      iconClass="bg-indigo-50 text-indigo-700"
      title="Başlıq menyusunu yenidən qur"
      description={
        <>
          Menyu quruluşu koda əlavə olunub, amma <b>bazada köhnə qalıb</b>.
          Bu düymə yalnız <b>header menyusunu</b> yenidən qurur —
          «Haqqımızda» altında Müəllimlər və Tələbələrimiz görünəcək.
        </>
      }
    >
      <Notice className="bg-indigo-50 text-indigo-800">
        Kurslar, müəllimlər, müraciətlər və footer menyusu
        <b> toxunulmur</b>. Tam seed işlətməyə ehtiyac yoxdur.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImportMenu(true)} disabled={menuing} className={BTN_OUTLINE}>
          <MenuIcon className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runImportMenu(false)}
          disabled={menuing}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <MenuIcon className="h-4 w-4" />
          {menuing ? "Qurulur…" : "Yenidən qur"}
        </button>
      </div>

      {menuReport && (
        <div className="mt-6">
          <ReportTitle>
            Nəticə — {menuReport.before} → {menuReport.after} bənd
            {menuReport.dryRun ? " (quru rejim)" : ""}
          </ReportTitle>
          <div className="space-y-1 rounded-lg border border-gray-100 p-3">
            {(menuReport.items || []).map((m, i) => (
              <div key={i} className={`text-sm ${m.level ? "pl-6 text-gray-500" : "font-semibold text-gray-800"}`}>
                {m.level ? "└ " : ""}{m.label} <span className="text-xs text-gray-400">{m.href}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolCard>
  );
}
