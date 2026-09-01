"use client";

// React
import { useState } from "react";
// Data
import {
  useAdminListQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
} from "@/store/api/adminApi";
// UI
import { QueryState } from "@/components/ui/QueryState";
import { confirmDialog, notify } from "@/components/ui/feedback";
// Form kit
import { Field, TextInput, NumberInput, NativeSelect, Toggle, SectionTitle, AddButton, RemoveButton } from "../_forms/kit";
import { LocalizedInput, LocalizedFormProvider, LocaleSwitcher, toLoc, locAz } from "../_forms/Localized";
// Icons
import { ClipboardList, Plus, Trash2, Pencil, Eye, ArrowLeft, Check, GripVertical } from "lucide-react";

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
 */

const ORDER_OPTIONS = [
  { value: "sequential", label: "Sıra ilə (order üzrə)" },
  { value: "random", label: "Təsadüfi" },
];

/** Boş sual şablonu — dörd variant ən çox işlənən formatdır. */
const emptyQuestion = () => ({
  text: toLoc(""),
  options: [toLoc(""), toLoc(""), toLoc(""), toLoc("")].map((text) => ({ text })),
  correctIndex: 0,
  explanation: toLoc(""),
  isActive: true,
});

/** Bir sualın redaktoru. */
function QuestionCard({ q, index, onChange, onRemove }) {
  const set = (patch) => onChange({ ...q, ...patch });

  const setOption = (oi, text) => {
    const options = q.options.map((o, i) => (i === oi ? { ...o, text } : o));
    set({ options });
  };

  const addOption = () => set({ options: [...q.options, { text: toLoc("") }] });

  const removeOption = (oi) => {
    if (q.options.length <= 2) {
      notify.error("Ən az iki variant olmalıdır");
      return;
    }
    const options = q.options.filter((_, i) => i !== oi);
    // Düzgün cavab silinən variantdan sonradırsa indeks sürüşür — düzəldirik,
    // əks halda düzgün cavab başqa varianta keçərdi.
    let correctIndex = q.correctIndex;
    if (oi === correctIndex) correctIndex = 0;
    else if (oi < correctIndex) correctIndex -= 1;
    set({ options, correctIndex });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
          <GripVertical className="h-4 w-4" />
          Sual {index + 1}
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={q.isActive !== false} onChange={(v) => set({ isActive: v })} label="Aktiv" />
          <RemoveButton onClick={onRemove} />
        </div>
      </div>

      <Field label="Sual mətni" required>
        <LocalizedInput value={q.text} onChange={(v) => set({ text: v })} multiline rows={2} />
      </Field>

      <SectionTitle>Variantlar — düzgün olanı seç</SectionTitle>
      <div className="space-y-2">
        {q.options.map((o, oi) => (
          <div key={oi} className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => set({ correctIndex: oi })}
              title="Düzgün cavab"
              className={`mt-2 grid h-7 w-7 flex-none place-items-center rounded-full border-2 transition ${
                q.correctIndex === oi
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 bg-white text-transparent hover:border-emerald-400"
              }`}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <span className="mt-2.5 w-4 flex-none text-xs font-bold text-gray-400">
              {String.fromCharCode(65 + oi)}
            </span>
            <div className="min-w-0 flex-1">
              <LocalizedInput value={o.text} onChange={(v) => setOption(oi, v)} />
            </div>
            <button
              type="button"
              onClick={() => removeOption(oi)}
              className="mt-2 rounded-lg border border-gray-200 p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AddButton onClick={addOption}>Variant əlavə et</AddButton>
      </div>

      <div className="mt-4">
        <Field label="İzah (istəyə bağlı)" hint="Nəticə səhifəsində cavabdan sonra göstərilir.">
          <LocalizedInput value={q.explanation} onChange={(v) => set({ explanation: v })} multiline rows={2} />
        </Field>
      </div>
    </div>
  );
}

/** Bir testin redaktə ekranı. */
function QuizEditor({ item, onBack }) {
  const isEdit = Boolean(item?._id);
  const [create, { isLoading: creating }] = useAdminCreateMutation();
  const [update, { isLoading: updating }] = useAdminUpdateMutation();

  const [tab, setTab] = useState("meta");
  const [form, setForm] = useState({
    title: toLoc(item?.title),
    slug: item?.slug || "",
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

  const setQuestion = (i, q) =>
    setForm((f) => ({ ...f, questions: f.questions.map((x, xi) => (xi === i ? q : x)) }));

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
      questions: form.questions.map((q, i) => ({ ...q, order: i })),
    };

    try {
      if (isEdit) await update({ resource: "quizzes", id: item._id, data }).unwrap();
      else await create({ resource: "quizzes", data }).unwrap();
      notify.success("Yadda saxlanıldı");
      onBack();
    } catch (e) {
      const msg = e?.data?.message || "";
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

        {tab === "meta" && (
          <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 md:grid-cols-2">
            <Field label="Başlıq" required className="md:col-span-2">
              <LocalizedInput value={form.title} onChange={(v) => set("title", v)} />
            </Field>

            <Field label="Slug" required hint="Ünvanda görünür: /testler/<slug>">
              <TextInput value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="english-test" />
            </Field>

            <Field label="Sıra">
              <NumberInput value={form.order} onChange={(e) => set("order", e.target.value)} />
            </Field>

            <Field label="Qısa təsvir" className="md:col-span-2">
              <LocalizedInput value={form.lead} onChange={(v) => set("lead", v)} />
            </Field>

            <Field label="Ətraflı təsvir" className="md:col-span-2">
              <LocalizedInput value={form.description} onChange={(v) => set("description", v)} multiline rows={3} />
            </Field>

            <Field label="Sual sırası" hint="Təsadüfi seçilsə hər açılışda sıra dəyişir.">
              {/* NativeSelect hadisə formasında qaytarır ({target:{value}}),
                  xam dəyər yox — kitin qalan sahələri ilə eyni imza. */}
              <NativeSelect
                options={ORDER_OPTIONS}
                value={form.questionOrder}
                onChange={(e) => set("questionOrder", e.target.value)}
              />
            </Field>

            <Field label="Göstəriləcək sual sayı" hint="0 = hamısı. Sual bankından alt çoxluq seçmək üçün.">
              <NumberInput value={form.questionCount} onChange={(e) => set("questionCount", e.target.value)} />
            </Field>

            <Field label="Vaxt limiti (dəq)" hint="0 = limitsiz.">
              <NumberInput value={form.timeLimitMin} onChange={(e) => set("timeLimitMin", e.target.value)} />
            </Field>

            <Field label="Variantlar qarışdırılsın">
              <Toggle
                checked={form.shuffleOptions}
                onChange={(v) => set("shuffleOptions", v)}
                label="Düzgün cavab həmişə eyni yerdə olmasın"
              />
            </Field>

            <Field label="Nəticə düyməsinin adı" className="md:col-span-2">
              <LocalizedInput value={form.ctaLabel} onChange={(v) => set("ctaLabel", v)} />
            </Field>

            <Field label="Nəticə düyməsinin ünvanı" className="md:col-span-2" hint="Məsələn /kurslar/ingilis-dili-kurslari">
              <TextInput value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
            </Field>

            <Field label="Vəziyyət" className="md:col-span-2">
              <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} label="Saytda göstərilsin" />
            </Field>
          </div>
        )}

        {tab === "questions" && (
          <div className="space-y-3">
            {form.questions.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
                Hələ sual yoxdur.
              </p>
            )}
            {form.questions.map((q, i) => (
              <QuestionCard
                key={i}
                q={q}
                index={i}
                onChange={(nq) => setQuestion(i, nq)}
                onRemove={() =>
                  setForm((f) => ({ ...f, questions: f.questions.filter((_, xi) => xi !== i) }))
                }
              />
            ))}
            <AddButton onClick={() => setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }))}>
              Sual əlavə et
            </AddButton>
          </div>
        )}
      </div>
    </LocalizedFormProvider>
  );
}

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
      notify.error(e?.data?.message || "Silinə bilmədi");
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Test</th>
                <th className="px-4 py-3">Ünvan</th>
                <th className="px-4 py-3 text-right">Sual</th>
                <th className="px-4 py-3 text-right">Baxış</th>
                <th className="px-4 py-3 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    Hələ test yoxdur. Developer bölməsindən başlanğıc testləri yükləyə bilərsən.
                  </td>
                </tr>
              )}
              {items.map((q) => (
                <tr key={q._id} className={q.isActive ? "" : "bg-gray-50/60 opacity-70"}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{locAz(q.title)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">/testler/{q.slug}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{q.questions?.length || 0}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                      {(q.views || 0).toLocaleString("az-AZ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(q)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50"
                        title="Redaktə et"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => runDelete(q)}
                        className="rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
