"use client";

// React
import { useState } from "react";

// Icons
import { Route } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useMigrateSlugsMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { BTN_OUTLINE, Notice } from "./shared";

export default function SlugMigrationTool() {
  const [migrateSlugs, { isLoading: slugging }] = useMigrateSlugsMutation();
  const [slugReport, setSlugReport] = useState(null);

  // Kurs sluglarını köhnə saytın ünvanlarına uyğunlaşdırır. Yalnız `slug`
  // sahəsi dəyişir — mətn, qiymət, şəkil və baxış sayğacı toxunulmur.
  const runMigrateSlugs = async (dryRun) => {
    if (!dryRun) {
      const ok = await confirmDialog({
        title: "Kurs slugları yenilənsin?",
        text: "Üç kursun ünvanı köhnə saytın (daha çox axtarılan) formasına keçir:<br><br><b>ingilis-dili-kursu → ingilis-dili-kurslari</b><br><b>ielts → ielts-kurslari</b><br><b>sat → sat-kurslari</b><br><br>Köhnə ünvanlar 301 ilə yenisinə yönləndirilir, ona görə mövcud linklər sınmır.",
        confirmText: "Yenilə",
      });
      if (!ok) return;
    }
    try {
      const res = await migrateSlugs({ dryRun }).unwrap();
      setSlugReport(res.data);
      notify.success(res.message || "Hazırdır");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Miqrasiya alınmadı"));
    }
  };

  return (
    <ToolCard
      icon={Route}
      iconClass="bg-indigo-50 text-indigo-700"
      title="Kurs sluglarını köhnə ünvanlara uyğunlaşdır"
      description={
        <>
          Köhnə saytda bu üç səhifə ayda <b>1300+ giriş</b> alırdı və ünvanları cəm
          formada idi. Slug həmin formaya keçirilir ki, axtarış reytinqi yeni
          səhifəyə otursun.
        </>
      }
    >
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-100 text-sm">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">ingilis-dili-kursu</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ ingilis-dili-kurslari</td></tr>
            <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">ielts</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ ielts-kurslari</td></tr>
            <tr><td className="px-3 py-2 font-mono text-xs text-gray-500">sat</td><td className="px-3 py-2 font-mono text-xs font-bold text-gray-900">→ sat-kurslari</td></tr>
          </tbody>
        </table>
      </div>

      <Notice className="bg-indigo-50 text-indigo-800">
        Yalnız <b>slug</b> dəyişir. Köhnə ünvan 301 ilə yenisinə yönləndirilir,
        ona görə paylaşılmış linklər sınmır. Təkrar işlədilə bilər.
      </Notice>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => runMigrateSlugs(true)} disabled={slugging} className={BTN_OUTLINE}>
          <Route className="h-4 w-4" /> Yoxla (quru rejim)
        </button>
        <button
          onClick={() => runMigrateSlugs(false)}
          disabled={slugging}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Route className="h-4 w-4" />
          {slugging ? "Yenilənir…" : "Yenilə"}
        </button>
      </div>

      {slugReport && (
        <div className="mt-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Nəticə — {slugReport.renamed} slug {slugReport.dryRun ? "dəyişəcək (quru rejim)" : "yeniləndi"}
          </div>
          {slugReport.changes?.length > 0 && (
            <ul className="space-y-1 text-sm">
              {slugReport.changes.map((c) => (
                <li key={c.from} className="font-mono text-xs text-emerald-700">✓ {c.from} → {c.to}</li>
              ))}
            </ul>
          )}
          {slugReport.skipped?.length > 0 && (
            <ul className="space-y-1 text-sm">
              {slugReport.skipped.map((c) => (
                <li key={c.from} className="font-mono text-xs text-gray-400">— {c.from}: {c.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ToolCard>
  );
}
