"use client";

import { toList } from "@/utils/toList";

// Static "running text" band. The gradient background + per-word star colors
// live in globals.css under `body.ba-home .ba-mqband` — the homepage already
// sets `ba-home`, so this only needs the matching markup (id="ba-mq" with
// direct <span> children, each holding an inner <span> star).
const WORDS = [
  "İNGİLİS DİLİ",
  "IELTS 8.5",
  "DANIŞIQ KLUBU",
  "XARİCDƏ TƏHSİL",
  "RUS DİLİ",
  "ALMAN DİLİ",
  "BİZNES İNGİLİS",
];

const wordStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 38,
  color: "#fff",
  fontFamily: "'Poppins'",
  fontWeight: 700,
  fontSize: 16,
  letterSpacing: ".08em",
};

/**
 * Horizontal infinite-scroll strip of course keywords (CSS-animated loop).
 * `words` admin panelindən gəlir (Tənzimləmələr → Ana səhifə, 3 dildə);
 * boş olarsa yuxarıdakı defolt siyahı işlənir.
 */
export default function Marquee({ words }) {
  const list = toList(words);
  const source = list.length ? list : WORDS;
  // Duplicate the list so translateX(-50%) loops seamlessly.
  const items = [...source, ...source];
  return (
    <div
      className="ba-mqband"
      style={{ background: "#001452", transform: "rotate(-1.2deg)", width: "104%", margin: "70px -2% -8px", padding: "15px 0", overflow: "hidden" }}
    >
      <div
        id="ba-mq"
        style={{ display: "flex", alignItems: "center", gap: 38, whiteSpace: "nowrap", width: "max-content", willChange: "transform", animation: "ba-mq-scroll 28s linear infinite" }}
      >
        {items.map((w, i) => (
          <span key={i} style={wordStyle}>
            {w}
            <span style={{ color: "var(--accent)" }}>✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ba-mq-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
