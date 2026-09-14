"use client";

// Utils
import { keyOf, rowKey } from "@/utils";

// Local
import { AddButton } from "../../_forms/kit";
import { toLoc } from "../../_forms/Localized";
import { QuestionCard } from "./QuestionCard";

/** Boş sual şablonu — dörd variant ən çox işlənən formatdır. */
const emptyQuestion = () => ({
  _key: rowKey(),
  text: toLoc(""),
  options: [toLoc(""), toLoc(""), toLoc(""), toLoc("")].map((text) => ({ text })),
  correctIndex: 0,
  explanation: toLoc(""),
  isActive: true,
});

/** «Suallar» tabı — sual kartlarının siyahısı. */
export function QuizQuestionsTab({ form, setForm }) {
  const setQuestion = (i, q) =>
    setForm((f) => ({ ...f, questions: f.questions.map((x, xi) => (xi === i ? q : x)) }));

  return (
    <div className="space-y-3">
      {form.questions.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-400">
          Hələ sual yoxdur.
        </p>
      )}
      {form.questions.map((q, i) => (
        <QuestionCard
          key={keyOf(q)}
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
  );
}
