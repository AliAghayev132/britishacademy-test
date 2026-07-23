"use client";

import { useEffect, useRef, useState } from "react";
import { ApplyButton } from "./ApplyButton";

/**
 * Homepage hero. Rotating words with the brand colour cycling in sync (not
 * random — the colours come from SiteSetting.hero.colors) and a soft blob
 * backdrop. Respects prefers-reduced-motion.
 */
export function Hero({ hero, stats = [] }) {
  const words = hero?.words?.length ? hero.words : ["ingiliscə danış"];
  const colors = hero?.colors?.length ? hero.colors : ["#001478"];
  const [i, setI] = useState(0);
  const bgRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 3000);
    return () => clearInterval(t);
  }, [words.length]);

  const bg = colors[i % colors.length];

  return (
    <section className="ba-hero" style={{ position: "relative", background: bg, overflow: "hidden", transition: "background .8s ease" }} ref={bgRef}>
      <div style={{ position: "absolute", top: -100, left: "8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 68%)", filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -120, right: "6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.16), transparent 68%)", filter: "blur(24px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto", padding: "78px 28px 66px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "clamp(36px,5.2vw,56px)", lineHeight: 1.14, letterSpacing: "-.02em", color: "#fff", margin: 0 }}>
          {hero?.titlePrefix || "British Academy ilə"}<br />
          <span style={{ display: "inline-block", minHeight: "1.2em" }}>{words[i]}</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,.9)", maxWidth: 600, margin: "24px auto 0" }}>
          {hero?.subtitle}
        </p>

        {stats.length > 0 && (
          <div className="hero-stats" style={{ display: "flex", justifyContent: "center", gap: 56, marginTop: 44, flexWrap: "wrap" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: "-.02em" }}>{s.value}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.82)", marginTop: 5, maxWidth: 170 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 44 }}>
          <ApplyButton className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }}>
            Pulsuz sınaq dərsinə yazıl →
          </ApplyButton>
        </div>
      </div>
    </section>
  );
}
