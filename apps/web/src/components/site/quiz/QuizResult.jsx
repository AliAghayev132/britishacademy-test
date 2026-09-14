"use client";

// React
import { useMemo } from "react";

// Next
import Link from "next/link";

// Icons
import { Check, X, RotateCcw, Award } from "lucide-react";

const ACCENT = "var(--accent)";

/** Nəticə ekranı — bal, səviyyə və cavabların təhlili. */
export default function QuizResult({ data, questions, onRetry, t }) {
  const byId = useMemo(
    () => new Map(questions.map((q) => [String(q._id), q])),
    [questions],
  );

  const pct = data.percent;
  // Rəng balı dərhal oxunaqlı edir: qırmızı/sarı/yaşıl.
  const tone = pct >= 70 ? "#16A34A" : pct >= 40 ? "#D97706" : "#DC2626";

  return (
    <div>
      {/* Bal */}
      <div
        style={{
          border: "1px solid #ECEDF2",
          borderRadius: 22,
          padding: "34px 26px",
          textAlign: "center",
          background: "#fff",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#8A8A96", fontSize: 13, fontWeight: 700, letterSpacing: 0.6 }}>
          <Award size={15} /> {t("quiz.result").toUpperCase()}
        </div>

        <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 800, fontSize: 58, color: tone, lineHeight: 1.1, marginTop: 6 }}>
          {data.score}
          <span style={{ fontSize: 30, color: "#B4B4BE" }}>/{data.total}</span>
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 14.5, color: "#63636F" }}>
          {pct}% · {data.score} {t("quiz.correctOf")}
        </p>

        {/* Bal zolağı */}
        <div style={{ height: 8, borderRadius: 99, background: "#F0F1F5", overflow: "hidden", margin: "18px auto 0", maxWidth: 380 }}>
          <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: tone, borderRadius: 99, transition: "width .5s" }} />
        </div>

        {data.level && (
          <div style={{ marginTop: 22, paddingTop: 20, borderTop: "1px solid #F0F1F5" }}>
            <div
              style={{
                display: "inline-block",
                background: ACCENT,
                color: "#fff",
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontWeight: 800,
                fontSize: 20,
                padding: "7px 20px",
                borderRadius: 99,
              }}
            >
              {data.level.label}
            </div>
            {data.level.title && (
              <h3 style={{ margin: "14px 0 0", fontSize: 18, fontWeight: 700, color: "#14141C" }}>
                {data.level.title}
              </h3>
            )}
            {data.level.description && (
              <p style={{ margin: "8px auto 0", maxWidth: 520, fontSize: 15, lineHeight: 1.7, color: "#63636F" }}>
                {data.level.description}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 24 }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              border: "1px solid #E4E5EC", background: "#fff", color: "#33333D",
              fontWeight: 700, fontSize: 14.5, padding: "12px 22px", borderRadius: 99,
              fontFamily: "inherit", cursor: "pointer",
            }}
          >
            <RotateCcw size={15} /> {t("quiz.retry")}
          </button>
          {data.cta?.href && (
            <Link
              href={data.cta.href}
              style={{
                display: "inline-flex", alignItems: "center",
                background: ACCENT, color: "#fff", fontWeight: 700,
                fontSize: 14.5, padding: "12px 24px", borderRadius: 99,
              }}
            >
              {data.cta.label}
            </Link>
          )}
        </div>
      </div>

      {/* Cavabların təhlili */}
      <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 19, fontWeight: 700, color: "#14141C", margin: "34px 0 14px" }}>
        {t("quiz.review")}
      </h2>

      <div style={{ display: "grid", gap: 10 }}>
        {data.results.map((r, i) => {
          const q = byId.get(String(r.questionId));
          if (!q) return null;
          const chosen = q.options.find((o) => String(o._id) === String(r.chosenOptionId));
          const correct = q.options.find((o) => String(o._id) === String(r.correctOptionId));

          return (
            <div
              key={r.questionId}
              style={{
                border: `1px solid ${r.isCorrect ? "#D3F0DE" : "#F8DADA"}`,
                background: r.isCorrect ? "#F5FCF8" : "#FFF8F8",
                borderRadius: 16,
                padding: "16px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <span
                  style={{
                    flex: "none", width: 22, height: 22, borderRadius: 99,
                    display: "grid", placeItems: "center",
                    background: r.isCorrect ? "#16A34A" : "#DC2626", color: "#fff",
                    marginTop: 1,
                  }}
                >
                  {r.isCorrect ? <Check size={13} /> : <X size={13} />}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: "#22222C", lineHeight: 1.55 }}>
                    <span style={{ color: "#9A9AA6", fontWeight: 700 }}>{i + 1}.</span> {q.text}
                  </p>

                  {!r.isCorrect && (
                    <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8A5252" }}>
                      {t("quiz.yourAnswer")}: <b>{chosen?.text || t("quiz.noAnswer")}</b>
                    </p>
                  )}
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#3E7A56" }}>
                    {t("quiz.correctAnswer")}: <b>{correct?.text || "—"}</b>
                  </p>

                  {r.explanation && (
                    <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#7A7A86", lineHeight: 1.6 }}>
                      {r.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
