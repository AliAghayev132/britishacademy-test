"use client";

// Icons
import { Trash2, Check, GripVertical } from "lucide-react";

// Components
import { notify } from "@/components";

// Local
import { Field, Toggle, SectionTitle, AddButton, RemoveButton } from "../../_forms/kit";
import { LocalizedInput, toLoc } from "../../_forms/Localized";

/** Bir sualın redaktoru. */
export function QuestionCard({ q, index, onChange, onRemove }) {
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
