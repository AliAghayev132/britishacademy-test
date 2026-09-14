"use client";

// React
import { useState } from "react";

// Icons
import { Database } from "lucide-react";

// Components
import { confirmDialog, notify } from "@/components";

// Store
import { useAdminSeedMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import ToolCard from "./ToolCard";
import { CountGrid, Notice } from "./shared";

export default function SeedTool() {
  const [seed, { isLoading: seeding }] = useAdminSeedMutation();
  const [seedConfirm, setSeedConfirm] = useState("");
  const [counts, setCounts] = useState(null);

  // TAM SIFIRLAMA — bütün məzmunu silib yenidən qurur.
  const runSeed = async () => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Bütün məzmun silinsin?",
      text: "Kurslar, müəllimlər, filiallar, dərs qrafiki, rəylər, ölkələr, menyu və səhifələr <b>TAMAMİLƏ SİLİNİR</b> və başlanğıc data ilə yenidən qurulur.<br><br>Müraciətlər (leads) və istifadəçi hesabları silinmir.<br><br><b>Bu əməliyyat geri qaytarıla bilməz.</b>",
      confirmText: "Bəli, sil və yenidən yüklə",
      cancelText: "İmtina",
    });
    if (!ok) return;
    try {
      const res = await seed().unwrap();
      setCounts(res?.data?.counts || null);
      setSeedConfirm("");
      notify.success(res?.message || "Yenidən yükləndi");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Alınmadı"));
    }
  };

  return (
    <ToolCard
      danger
      icon={Database}
      iconClass="bg-red-100 text-red-700"
      title="Bütün datanı sil və yenidən yüklə"
      description={
        <>
          Kurslar, müəllimlər, filiallar, dərs qrafiki, rəylər, ölkələr, menyu və
          səhifələr <b>tamamilə silinir</b> və başlanğıc data ilə yenidən qurulur.
        </>
      }
    >
      <Notice className="bg-red-100 text-red-900">
        <b>Geri qaytarıla bilməz.</b> Müraciətlər və istifadəçi hesabları
        silinmir. Bu əməliyyatdan sonra müştəri məlumatlarını (filial,
        müəllim, kurs importları) yenidən tətbiq etmək lazımdır.
      </Notice>

      {/* Yazılı təsdiq — təsadüfi klikin qarşısını alır */}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-red-700">
          Təsdiq üçün «SIFIRLA» yazın
        </label>
        <input
          value={seedConfirm}
          onChange={(e) => setSeedConfirm(e.target.value)}
          placeholder="SIFIRLA"
          className="w-48 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-500"
        />
      </div>

      <button
        onClick={runSeed}
        disabled={seeding || seedConfirm.trim().toUpperCase() !== "SIFIRLA"}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
      >
        <Database className="h-4 w-4" />
        {seeding ? "Yüklənir…" : "Sil və yenidən yüklə"}
      </button>

      {counts && <CountGrid title="Yükləndi" counts={counts} cellBg="bg-white" />}
    </ToolCard>
  );
}
