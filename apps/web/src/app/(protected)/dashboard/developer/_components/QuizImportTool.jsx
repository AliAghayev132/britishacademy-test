"use client";

// React
import { useState } from "react";

// Icons
import { ClipboardList } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useImportQuizzesMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OVERWRITE, Notice } from "./shared";

export default function QuizImportTool() {
  const [importQuizzes, { isLoading: quizzing }] = useImportQuizzesMutation();
  const [quizReport, setQuizReport] = useState(null);

  // Səviyyə testlərini yükləyir. Mövcud test TOXUNULMUR — admin sualları
  // redaktə etmiş ola bilər; üzərinə yazmaq üçün ayrıca düymə var.
  const runImportQuizzes = async (overwrite) => {
    const ok = await confirmDialog({
      tone: overwrite ? "error" : undefined,
      title: overwrite ? "Testlər başlanğıc məzmunla əvəz olunsun?" : "Testlər yüklənsin?",
      text: overwrite
        ? "Mövcud testlərin <b>bütün sualları silinir</b> və başlanğıc dəsti ilə əvəz olunur. Admin paneldə etdiyin redaktələr itir."
        : "İngilis və Rus dili səviyyə testləri yaradılır. <b>Mövcud test toxunulmur.</b>",
      confirmText: overwrite ? "Bəli, əvəz et" : "Yüklə",
    });
    if (!ok) return;
    try {
      const res = await importQuizzes({ overwrite }).unwrap();
      setQuizReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "İmport alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={ClipboardList}
      iconClass="bg-sky-50 text-sky-700"
      title="Səviyyə testlərini yüklə"
      description={
        <>
          İngilis dili (28 sual) və Rus dili (22 sual) testləri — CEFR şkalası ilə
          A1–C1 nəticəsi. Köhnə saytın ən çox girilən iki səhifəsi
          (<b>/english-test</b>, <b>/rus-dili-test</b>) bunlara yönləndirilir.
        </>
      }
    >
      <Notice className="bg-sky-50 text-sky-800">
        Mövcud test <b>toxunulmur</b> — sualları paneldən redaktə etmisənsə itmir.
        Başlanğıc məzmuna qayıtmaq üçün «Üzərinə yaz» işlədilir.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => runImportQuizzes(false)}
          disabled={quizzing}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          <ClipboardList className="h-4 w-4" />
          {quizzing ? "Yüklənir…" : "Testləri yüklə"}
        </button>
        <button onClick={() => runImportQuizzes(true)} disabled={quizzing} className={BTN_OVERWRITE}>
          Üzərinə yaz
        </button>
      </div>

      {quizReport && (
        <ul className="mt-6 space-y-1 text-sm">
          {quizReport.items.map((r) => (
            <li key={r.slug} className="font-mono text-xs text-gray-600">
              {r.slug} — {r.status} ({r.questions} sual)
            </li>
          ))}
        </ul>
      )}
    </ToolCard>
  );
}
