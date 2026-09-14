"use client";

/** Section heading used across pages. */
export default function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", letterSpacing: "-.02em", margin: 0, lineHeight: 1.08, color: "#14141C" }}>{title}</h2>
      {sub && <div style={{ color: "#7C7D8C", fontFamily: "'Poppins'", fontWeight: 700, fontSize: "clamp(20px,3vw,30px)", lineHeight: 1.1 }}>{sub}</div>}
    </div>
  );
}
