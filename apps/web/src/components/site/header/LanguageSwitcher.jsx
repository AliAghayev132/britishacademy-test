"use client";

// React
import { memo } from "react";

// Local
import useLangSwitch from "./useLangSwitch";

// ── Dil seçicisi (AZ/EN/RU) — üst lentdə, yalnız masaüstü ──
const LanguageSwitcher = memo(function LanguageSwitcher() {
  const { locale, go } = useLangSwitch();
  return (
    <div style={{ display: "inline-flex", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 99, padding: 2 }}>
      {["az", "en", "ru"].map((l) => {
        const on = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => go(l)}
            style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: on ? "var(--accent)" : "transparent", color: on ? "#fff" : "rgba(255,255,255,.65)" }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
});

export default LanguageSwitcher;
