"use client";

// Icons
import { Languages } from "lucide-react";

// Components
import { notify } from "@/components";

// Store
import { useImportContactMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice } from "./shared";

export default function ContactImportTool() {
  const [importContact, { isLoading: contacting }] = useImportContactMutation();

  // Ünvan/iş saatları sonradan çoxdilli edildi — bazadakı köhnə sətirlər
  // yalnız AZ qalmışdı və hər səhifədə azərbaycanca görünürdü.
  const runImportContact = async (dryRun) => {
    try {
      const res = await importContact({ dryRun }).unwrap();
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={Languages}
      iconClass="bg-teal-50 text-teal-700"
      title="Əlaqə məlumatlarını 3 dilə tamamla"
      description={
        <>
          <b>Ünvan</b> və <b>iş saatları</b> əvvəl tək dildə saxlanılırdı və
          /en, /ru saytlarında azərbaycanca görünürdü — həm də hər
          səhifədə (üst lent və footer). Bu düymə onları lüğətdən
          tamamlayır.
        </>
      }
    >
      <Notice className="bg-teal-50 text-teal-800">
        Artıq DOLU olan dilə toxunmur — panelə əl ilə yazdığın mətn
        üstündən yazılmır. Təkrar işlədilə bilər.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runImportContact(true)} disabled={contacting} className={BTN_OUTLINE}>
          <Languages className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runImportContact(false)}
          disabled={contacting}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          <Languages className="h-4 w-4" />
          {contacting ? "Tamamlanır…" : "Tamamla"}
        </button>
      </div>
    </ToolCard>
  );
}
