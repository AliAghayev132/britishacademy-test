"use client";

// React
import { useState } from "react";

// Icons
import { Languages } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminMigrateI18nMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { CountGrid } from "./shared";

export default function I18nMigrationTool() {
  const [migrate, { isLoading: migrating }] = useAdminMigrateI18nMutation();
  const [migrateReport, setMigrateReport] = useState(null);

  const runMigrateI18n = async () => {
    const ok = await confirmDialog({
      tone: "warning",
      title: "Çoxdilli miqrasiya işə salınsın?",
      text: "Mövcud məzmun (kurs, müəllim, filial, səhifə və s.) tək dildən <b>3-dilli { az, en, ru }</b> formasına çevrilir.<br><br>Data <b>itmir</b> — mövcud mətn AZ variantı olur, EN/RU boş qalır. Təhlükəsiz və təkrar-icra oluna bilər.",
      confirmText: "Bəli, miqrasiya et",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await migrate().unwrap();
      setMigrateReport(res?.data?.report || null);
      notify.success(res?.message || "Miqrasiya tamamlandı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Xəta baş verdi"));
    }
  };

  return (
    <ToolCard
      icon={Languages}
      iconClass="bg-emerald-50 text-emerald-700"
      title="Çoxdilli (3 dil) miqrasiya"
      description={
        <>
          Köhnə tək-dilli məzmunu <b>{"{ az, en, ru }"}</b> formasına çevirir. Mövcud mətn AZ variantı
          olur, EN/RU sonradan admin paneldən doldurulur. Data itmir, təkrar-icra təhlükəsizdir.
        </>
      }
    >
      <button
        onClick={runMigrateI18n}
        disabled={migrating}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <Languages className="h-4 w-4" />
        {migrating ? "Miqrasiya olunur…" : "Çoxdilli formata keçir"}
      </button>

      {migrateReport && <CountGrid counts={migrateReport} value={(v) => v.changedDocs ?? 0} />}
    </ToolCard>
  );
}
