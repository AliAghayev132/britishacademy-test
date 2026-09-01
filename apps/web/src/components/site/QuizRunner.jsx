"use client";

// React
import { useMemo, useState } from "react";
// Next
import Link from "next/link";
// Icons
import { Check, X, ChevronLeft, ChevronRight, RotateCcw, Award } from "lucide-react";
// i18n
import { useT } from "@/lib/i18n/useT";

/**
 * Testin interaktiv hissəsi.
 *
 * QİYMƏTLƏNDİRMƏ BURADA APARILMIR. Düzgün cavablar səhifəyə heç vaxt
 * göndərilmir — cavablar serverə göndərilir və nəticə oradan gəlir. Əks halda
 * cavabları səhifənin mənbə kodundan oxumaq olardı və testin mənası qalmazdı.
 *
 * Bir ekranda bir sual göstərilir: 28 sualı bir siyahıda vermək telefonda
 * bitib-tükənməz sürüşdürmə deməkdir və adamların yarısı yarıda buraxır.
 */

const ACCENT = "var(--accent)";

// API ayrı portdadır (Next 30001, Express 30002) və heç bir rewrite yoxdur,
// ona görə nisbi "/api/..." işləməz — tam ünvan lazımdır.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Nəticə ekranı — bal, səviyyə və cavabların təhlili. */
function Result({ data, questions, onRetry, t }) {
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

export function QuizRunner({ quiz }) {
  const t = useT();
  const questions = quiz?.questions || [];

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId → optionId
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const current = questions[idx];

  if (total === 0) {
    return <p style={{ color: "#8A8A96" }}>{t("quiz.empty")}</p>;
  }

  if (result) {
    return (
      <Result
        data={result}
        questions={questions}
        t={t}
        onRetry={() => {
          setResult(null);
          setAnswers({});
          setIdx(0);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );
  }

  const choose = (optionId) => {
    setAnswers((a) => ({ ...a, [current._id]: optionId }));
    // Son sual deyilsə avtomatik növbətiyə keç — 28 sualda hər dəfə
    // «Növbəti» basmaq lazımsız sürtünmədir.
    if (idx < total - 1) {
      setTimeout(() => setIdx((i) => Math.min(i + 1, total - 1)), 180);
    }
  };

  const submit = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quiz.slug}/submit?lang=${quiz.lang || "az"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
        }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "error");
      setResult(json.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("quiz.error"));
    } finally {
      setSending(false);
    }
  };

  const allAnswered = answeredCount === total;

  return (
    <div>
      {/* İrəliləyiş */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#8A8A96" }}>
          {t("quiz.question")} {idx + 1} {t("quiz.of")} {total}
        </span>
        <span style={{ fontSize: 13.5, color: "#B4B4BE" }}>
          {answeredCount}/{total}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#F0F1F5", overflow: "hidden", marginBottom: 22 }}>
        <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: ACCENT, borderRadius: 99, transition: "width .3s" }} />
      </div>

      {/* Sual */}
      <div style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: "24px 22px", background: "#fff" }}>
        <p style={{ margin: 0, fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 19, fontWeight: 700, color: "#14141C", lineHeight: 1.5 }}>
          {current.text}
        </p>

        <div style={{ display: "grid", gap: 9, marginTop: 20 }}>
          {current.options.map((o, oi) => {
            const on = answers[current._id] === o._id;
            return (
              <button
                key={o._id}
                type="button"
                onClick={() => choose(o._id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  textAlign: "left", width: "100%",
                  border: `1.5px solid ${on ? ACCENT : "#E4E5EC"}`,
                  background: on ? "rgba(0,21,122,.04)" : "#fff",
                  borderRadius: 14, padding: "14px 16px",
                  fontFamily: "inherit", fontSize: 15.5,
                  fontWeight: on ? 700 : 500,
                  color: on ? ACCENT : "#33333D",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                <span
                  style={{
                    flex: "none", width: 26, height: 26, borderRadius: 99,
                    display: "grid", placeItems: "center",
                    border: `1.5px solid ${on ? ACCENT : "#D8D9E2"}`,
                    background: on ? ACCENT : "#fff",
                    color: on ? "#fff" : "#9A9AA6",
                    fontSize: 12.5, fontWeight: 800,
                  }}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                {o.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Naviqasiya */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
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
            onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
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
            onClick={submit}
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

      {/* Sual nömrələri — cavabsız qalanı tapmaq üçün */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>
        {questions.map((q, i) => {
          const done = Boolean(answers[q._id]);
          const on = i === idx;
          return (
            <button
              key={q._id}
              type="button"
              onClick={() => setIdx(i)}
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

      {!allAnswered && idx === total - 1 && (
        <p style={{ marginTop: 12, fontSize: 13.5, color: "#C2792F" }}>
          {total - answeredCount} {t("quiz.unanswered")} — {t("quiz.answerAll")}
        </p>
      )}
      {error && (
        <p style={{ marginTop: 12, fontSize: 13.5, color: "#DC2626" }}>{error}</p>
      )}
    </div>
  );
}
