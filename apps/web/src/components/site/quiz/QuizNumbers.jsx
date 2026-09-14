"use client";

const ACCENT = "var(--accent)";

/** Sual nömrələri — cavabsız qalanı tapmaq üçün. */
export default function QuizNumbers({ questions, answers, idx, onJump, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>
      {questions.map((q, i) => {
        const done = Boolean(answers[q._id]);
        const on = i === idx;
        return (
          <button
            key={q._id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`${t("quiz.question")} ${i + 1}`}
            style={{
              width: 32, height: 32, borderRadius: 9,
              border: `1px solid ${on ? ACCENT : done ? "#CFE0CF" : "#E4E5EC"}`,
              background: on ? ACCENT : done ? "#EEF7F0" : "#fff",
              color: on ? "#fff" : done ? "#3E7A56" : "#9A9AA6",
              fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
