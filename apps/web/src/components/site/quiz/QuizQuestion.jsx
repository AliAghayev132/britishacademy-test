"use client";

const ACCENT = "var(--accent)";

/** Tək sual və onun variantları; seçilmiş variant `selected` ilə gəlir. */
export default function QuizQuestion({ question, selected, onChoose }) {
  return (
    <div style={{ border: "1px solid #ECEDF2", borderRadius: 20, padding: "24px 22px", background: "#fff" }}>
      <p style={{ margin: 0, fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 19, fontWeight: 700, color: "#14141C", lineHeight: 1.5 }}>
        {question.text}
      </p>

      <div style={{ display: "grid", gap: 9, marginTop: 20 }}>
        {question.options.map((o, oi) => {
          const on = selected === o._id;
          return (
            <button
              key={o._id}
              type="button"
              onClick={() => onChoose(o._id)}
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
  );
}
