"use client";

// React
import { useState } from "react";

// Icons
import { ArrowLeft } from "lucide-react";

// Components
import { notify } from "@/components";

// Store
import { useAdminListQuery, useAdminCreateMutation, useAdminUpdateMutation } from "@/store";

// Lib
import { pickAz } from "@/lib";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
import { LocalizedFormProvider, LocaleSwitcher, toLoc, locAz } from "../../_forms/Localized";
import { QuizMetaTab } from "./QuizMetaTab";
import { QuizQuestionsTab } from "./QuizQuestionsTab";

/** Bir testin redaktə ekranı. */
export function QuizEditor({ item, onBack }) {
  const isEdit = Boolean(item?._id);
  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  // Kateqoriya seçimi üçün siyahı. Boşdursa sahə göstərilmir — admin əvvəlcə
  // «Test kateqoriyaları» bölməsindən yaratmalıdır.
  const { data: catData } = useAdminListQuery({ resource: "quiz-categories", limit: 100 });
  const categoryOptions = (catData?.data?.items || []).map((c) => ({
    value: c._id,
    label: pickAz(c.name),
  }));

  const [tab, setTab] = useState("meta");
  const [form, setForm] = useState({
    title: toLoc(item?.title),
    slug: item?.slug || "",
    // Kateqoriya boş ola bilər — testlər səhifəsində «Digər» altında toplanır.
    category: item?.category?._id || item?.category || "",
    lead: toLoc(item?.lead),
    description: toLoc(item?.description),
    questionOrder: item?.questionOrder || "sequential",
    questionCount: String(item?.questionCount ?? 0),
    shuffleOptions: Boolean(item?.shuffleOptions),
    timeLimitMin: String(item?.timeLimitMin ?? 0),
    ctaLabel: toLoc(item?.ctaLabel),
    ctaHref: item?.ctaHref || "",
    order: String(item?.order ?? 0),
    isActive: isEdit ? Boolean(item?.isActive) : true,
    questions: (item?.questions || []).map((q) => ({
      ...q,
      text: toLoc(q.text),
      explanation: toLoc(q.explanation),
      options: (q.options || []).map((o) => ({ ...o, text: toLoc(o.text) })),
    })),
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.slug.trim()) {
      notify.error("Slug boş ola bilməz");
      return;
    }
    if (!locAz(form.title).trim()) {
      notify.error("Başlıq boş ola bilməz");
      return;
    }
    // Server də yoxlayır, amma burada dayandırmaq admini «niyə işləmir»
    // axtarışından xilas edir.
    const bad = form.questions.findIndex(
      (q) => q.correctIndex >= q.options.length || q.options.some((o) => !locAz(o.text).trim()),
    );
    if (bad >= 0) {
      notify.error(`Sual ${bad + 1}: variantlardan biri boşdur və ya düzgün cavab seçilməyib`);
      return;
    }

    const data = {
      ...form,
      questionCount: Number(form.questionCount) || 0,
      timeLimitMin: Number(form.timeLimitMin) || 0,
      order: Number(form.order) || 0,
      // Boş sətir ObjectId kimi yazıla bilməz — sahə ümumiyyətlə göndərilmir.
      category: form.category || null,
      questions: form.questions.map(({ _key, ...q }, i) => ({ ...q, order: i })),
    };

    try {
      if (isEdit) await update({ resource: "quizzes", id: item._id, data }).unwrap();
      else await create({ resource: "quizzes", data }).unwrap();
      notify.success("Yadda saxlanıldı");
      onBack();
    } catch (e) {
      const msg = apiErrorMessage(e, "");
      notify.error(/duplicate|E11000/i.test(msg) ? "Bu slug artıq işlənir" : msg || "Yadda saxlanılmadı");
    }
  };

  const TABS = [
    { key: "meta", label: "Test məlumatı" },
    { key: "questions", label: `Suallar (${form.questions.length})` },
  ];

  return (
    <LocalizedFormProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> Testlərə qayıt
          </button>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <button
              onClick={save}
              disabled={creating || updating}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00157A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001a99] disabled:opacity-60"
            >
              {creating || updating ? "Saxlanılır…" : "Yadda saxla"}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 border-b border-gray-200">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                tab === tb.key
                  ? "border-[#00157A] text-[#00157A]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "meta" && <QuizMetaTab form={form} set={set} categoryOptions={categoryOptions} />}
        {tab === "questions" && <QuizQuestionsTab form={form} setForm={setForm} />}
      </div>
    </LocalizedFormProvider>
  );
}
