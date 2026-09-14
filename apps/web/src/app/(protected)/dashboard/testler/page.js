"use client";

// React
import { useState } from "react";

// Icons
import { ClipboardList, Plus } from "lucide-react";

// Components
import { QueryState, confirmDialog, notify } from "@/components";

// Store
import { useAdminListQuery, useAdminDeleteMutation } from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { locAz } from "../_forms/Localized";
import { QuizEditor } from "./_components/QuizEditor";
import { QuizzesTable } from "./_components/QuizzesTable";

/**
 * Testlərin idarəsi.
 *
 * NİYƏ AYRICA SƏHİFƏ, ÜMUMİ RESURS FORMASI YOX:
 * Bir testdə 20–30 sual var, hər sualda 4 variant, hər variant üç dildə.
 * Ümumi CRUD forması iç-içə massivləri redaktə edə bilmir, modal pəncərədə
 * isə bu qədər sahəni idarə etmək mümkün deyil — ona görə tam səhifə.
 *
 * Düzgün cavab radio ilə seçilir: iki cavabın eyni anda düzgün olması mümkün
 * deyil və `correctIndex` həmişə mövcud varianta işarə edir.
 *
 * Bu fayl siyahı + silmə axınıdır; redaktor və cədvəl `_components/` altındadır.
 */

export default function QuizzesPage() {
  const { data, isLoading, isError, error, refetch } = useAdminListQuery({
    resource: "quizzes",
    limit: 100,
  });
  const [remove] = useAdminDeleteMutation();
  const [editing, setEditing] = useState(null); // obyekt = redaktə, "new" = yeni

  const items = data?.data?.items || [];

  if (editing) {
    return (
      <QuizEditor
        item={editing === "new" ? null : editing}
        onBack={() => {
          setEditing(null);
          refetch();
        }}
      />
    );
  }

  if (isLoading || isError) {
    return <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} />;
  }

  const runDelete = async (q) => {
    const ok = await confirmDialog({
      tone: "error",
      title: "Test silinsin?",
      text: `<b>${locAz(q.title)}</b> və bütün sualları silinir. /testler/${q.slug} ünvanı 404 verəcək.`,
      confirmText: "Sil",
    });
    if (!ok) return;
    try {
      await remove({ resource: "quizzes", id: q._id }).unwrap();
      notify.success("Silindi");
    } catch (e) {
      notify.error(apiErrorMessage(e, "Silinə bilmədi"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <ClipboardList className="h-5 w-5 text-gray-400" />
            Testlər
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Köhnə saytda test səhifələri ən çox girilən səhifələr idi — /english-test və
            /rus-dili-test buradakı testlərə yönləndirilir.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001a99]"
        >
          <Plus className="h-4 w-4" /> Yeni test
        </button>
      </div>

      <QuizzesTable items={items} onEdit={setEditing} onDelete={runDelete} />
    </div>
  );
}
