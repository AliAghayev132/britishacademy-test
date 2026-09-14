"use client";

const ACCENT = "var(--accent)";

/** İrəliləyiş — cari sual nömrəsi, cavablananların sayı və zolaq. */
export default function QuizProgress({ idx, total, answeredCount, t }) {
  return (
    <>
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
    </>
  );
}
