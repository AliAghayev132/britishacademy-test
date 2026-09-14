"use client";

// Icons
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACCENT = "var(--accent)";

/** Əvvəlki / növbəti düymələri; son sualda «Bitir» (göndər) düyməsi. */
export default function QuizNav({ idx, total, allAnswered, sending, onPrev, onNext, onSubmit, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
      <button
        type="button"
        onClick={onPrev}
        disabled={idx === 0}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "1px solid #E4E5EC", background: "#fff",
          color: idx === 0 ? "#C8C9D2" : "#33333D",
          fontWeight: 700, fontSize: 14.5, padding: "11px 18px", borderRadius: 99,
          fontFamily: "inherit", cursor: idx === 0 ? "default" : "pointer",
        }}
      >
        <ChevronLeft size={16} /> {t("quiz.prev")}
      </button>

      {idx < total - 1 ? (
        <button
          type="button"
          onClick={onNext}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            border: "1px solid #E4E5EC", background: "#fff", color: "#33333D",
            fontWeight: 700, fontSize: 14.5, padding: "11px 18px", borderRadius: 99,
            fontFamily: "inherit", cursor: "pointer",
          }}
        >
          {t("quiz.next")} <ChevronRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allAnswered || sending}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: allAnswered ? ACCENT : "#C8C9D2", color: "#fff",
            border: "none", fontWeight: 700, fontSize: 14.5,
            padding: "12px 26px", borderRadius: 99,
            fontFamily: "inherit", cursor: allAnswered ? "pointer" : "default",
          }}
        >
          {sending ? t("quiz.sending") : t("quiz.finish")}
        </button>
      )}
    </div>
  );
}
