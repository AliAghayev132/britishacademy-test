"use client";

// React
import { useState } from "react";

// Icons
import { Sparkles } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminAutoTranslateMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { CountGrid, Notice } from "./shared";

export default function AutoTranslateTool() {
  const [autoTranslate, { isLoading: translating }] = useAdminAutoTranslateMutation();
  const [translateReport, setTranslateReport] = useState(null);
  const [langs, setLangs] = useState(["en", "ru"]);

  // Boş EN/RU sahələrini AI ilə doldur (mövcud tərcüməyə toxunmur).
  const runAutoTranslate = async () => {
    const shown = langs.map((l) => l.toUpperCase()).join(" və ");
    const ok = await confirmDialog({
      tone: "warning",
      title: "AI toplu tərcümə başlasın?",
      text: `Bazadakı <b>boş ${shown}</b> sahələri AZ mətnindən tərcümə ediləcək.<br><br>Mövcud tərcümələr <b>dəyişmir</b>. Əməliyyat bir neçə dəqiqə çəkə bilər.`,
      confirmText: "Bəli, başla",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await autoTranslate({ langs }).unwrap();
      setTranslateReport(res?.data?.report || null);
      notify.success(res?.message || "Tərcümə tamamlandı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Tərcümə alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={Sparkles}
      iconClass="bg-violet-50 text-violet-700"
      title="AI ilə toplu tərcümə"
      description={
        <>
          Bazadakı <b>boş EN/RU</b> sahələrini AZ mətnindən avtomatik doldurur — kurslar,
          müəllimlər, filiallar, ölkələr, rəylər, FAQ, SEO və s. Artıq tərcümə olunmuş
          sahələrə <b>toxunmur</b>, ona görə təkrar işlədilə bilər.
        </>
      }
    >
      <Notice className="bg-violet-50 text-violet-800">
        Əvvəlcə <b>Tənzimləmələr → AI</b> bölməsində OpenRouter açarını təyin edin.
        Əməliyyat məzmun həcmindən asılı olaraq bir neçə dəqiqə çəkə bilər — səhifəni bağlamayın.
      </Notice>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Dillər:</span>
        {["en", "ru"].map((l) => (
          <button
            key={l}
            onClick={() =>
              setLangs((prev) =>
                prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
              )
            }
            className={`rounded-md px-3 py-1 text-xs font-bold transition ${
              langs.includes(l)
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={runAutoTranslate}
        disabled={translating || !langs.length}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {translating ? "Tərcümə olunur… (gözləyin)" : "Boş dilləri AI ilə doldur"}
      </button>

      {translateReport && <CountGrid counts={translateReport} value={(v) => v.changedFields ?? 0} />}
    </ToolCard>
  );
}
