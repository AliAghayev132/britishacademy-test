"use client";

import { memo, useCallback, useState } from "react";

// ── Subcomponents ──
const FaqItem = memo(function FaqItem({ item, index, isOpen, onToggle }) {
  return (
    <div className="ba-faq" style={{ border: "1px solid #ECEDF2", borderRadius: 16, background: "#fff", overflow: "hidden" }}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(index)}
        style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "19px 22px", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
      >
        <span style={{ fontFamily: "'Poppins'", fontWeight: 600, fontSize: 16.5, color: "#1C1C26" }}>{item.question}</span>
        <span style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 600 }}>{isOpen ? "–" : "+"}</span>
      </button>
      <div style={{ maxHeight: isOpen ? 500 : 0, opacity: isOpen ? 1 : 0, overflow: "hidden", transition: "max-height .4s ease, opacity .35s ease" }}>
        <div style={{ padding: "0 22px 20px", fontSize: 15.5, color: "#5A5A66", lineHeight: 1.7 }}>{item.answer}</div>
      </div>
    </div>
  );
});

/** Accessible FAQ accordion. First item open by default. */
export function FaqAccordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  const toggle = useCallback((i) => setOpen((cur) => (cur === i ? -1 : i)), []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((f, i) => (
        <FaqItem key={i} item={f} index={i} isOpen={open === i} onToggle={toggle} />
      ))}
    </div>
  );
}
