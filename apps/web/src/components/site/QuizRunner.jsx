"use client";

// React
import { useState } from "react";

// Lib
import { API_URL, useT } from "@/lib";

// Local
import QuizResult from "./quiz/QuizResult";
import QuizProgress from "./quiz/QuizProgress";
import QuizQuestion from "./quiz/QuizQuestion";
import QuizNav from "./quiz/QuizNav";
import QuizNumbers from "./quiz/QuizNumbers";

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

// API_URL (@/lib): dəyişən boşdursa nisbi `/api` — nginx eyni domendə
// Express-ə ötürür. Əvvəl burada `localhost:5000` defoltu vardı və dəyişən
// unudulanda quiz nəticəsi ziyarətçinin öz kompüterinə göndərilirdi.

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
      <QuizResult
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
      const res = await fetch(`${API_URL}/quizzes/${quiz.slug}/submit?lang=${quiz.lang || "az"}`, {
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
      <QuizProgress idx={idx} total={total} answeredCount={answeredCount} t={t} />

      <QuizQuestion question={current} selected={answers[current._id]} onChoose={choose} />

      <QuizNav
        idx={idx}
        total={total}
        allAnswered={allAnswered}
        sending={sending}
        onPrev={() => setIdx((i) => Math.max(i - 1, 0))}
        onNext={() => setIdx((i) => Math.min(i + 1, total - 1))}
        onSubmit={submit}
        t={t}
      />

      <QuizNumbers questions={questions} answers={answers} idx={idx} onJump={setIdx} t={t} />

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
