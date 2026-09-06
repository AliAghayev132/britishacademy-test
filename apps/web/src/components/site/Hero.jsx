"use client";

import { useEffect, useRef, useState } from "react";
import { toList } from "@/utils/toList";
import { ApplyButton } from "./ApplyButton";
import { useT } from "@/lib/i18n/useT";

/** Floating glass chips — direct children divs of the hero so the per-position
 *  colour tints in globals.css (body.ba-home .ba-hero > div:nth-of-type(4..9)
 *  [data-chip]) apply. Positions/animation copied from the static hero. */
/**
 * Üzən şüşə sözlərin MÖVQELƏRİ — sabitdir, sözlər isə admin siyahısından
 * TƏSADÜFİ seçilir (sol və sağ müstəqil). Sözlər boşdursa DEFAULT_* işlənir.
 */
const SLOTS_LEFT = [
  { pos: { top: 66, left: "6%" }, rot: -8, anim: "ba-float 6s ease-in-out infinite", weight: 600 },
  { pos: { top: 300, left: "4%" }, rot: 6, anim: "ba-float 8s ease-in-out infinite 1.1s", weight: 700 },
  { pos: { bottom: 172, left: "9%" }, rot: -5, anim: "ba-float 7.5s ease-in-out infinite .9s", weight: 600 },
];
const SLOTS_RIGHT = [
  { pos: { top: 118, right: "7%" }, rot: 7, anim: "ba-float 7s ease-in-out infinite .6s", weight: 600 },
  { pos: { top: 360, right: "5%" }, rot: -6, anim: "ba-float 6.5s ease-in-out infinite .3s", weight: 700 },
  { pos: { bottom: 150, right: "10%" }, rot: 8, anim: "ba-float 6.8s ease-in-out infinite 1.4s", weight: 600 },
];

// Defolt siyahılar TƏRCÜMƏ AÇARLARINDADIR (hero.default*), sabit deyil.
// Əvvəl onlar burada azərbaycanca yazılmışdı: admin siyahını doldurmayanda
// EN/RU səhifədə də azərbaycanca «İngilis dili, Uşaqlar üçün…» görünürdü.

/** Fisher–Yates — siyahını qarışdırıb ilk n elementi qaytarır. */
function sample(list, n) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

const CHIP_STYLE = {
  display: "inline-block",
  padding: "10px 17px",
  borderRadius: 99,
  background: "rgba(255,255,255,.15)",
  border: "1px solid rgba(255,255,255,.28)",
  color: "#fff",
  fontSize: 15,
  whiteSpace: "nowrap",
  backdropFilter: "blur(3px)",
};

const PILL_BASE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  background: "#fff",
  color: "#1B1B26",
  fontWeight: 600,
  fontSize: 15,
  padding: "11px 18px",
  borderRadius: 99,
  boxShadow: "0 6px 16px rgba(20,20,40,.12)",
  textDecoration: "none",
};

// group digits with a thin space every 3 (matches static "20 000")
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Count-up stat value: parses "20 000+" → 20000 (+ suffix "+"), animates 0→n
 *  on mount, and respects prefers-reduced-motion (shows the final value). */
function StatValue({ raw }) {
  const target = parseInt(String(raw).replace(/\D/g, ""), 10) || 0;
  const suffix = (String(raw).match(/[^\d\s]+$/) || [""])[0];
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- təsadüfi söz seçimi mount-dan sonra olmalıdır — render zamanı SSR/klient fərqi yaradar (React #418)
      setN(target);
      return;
    }
    let raf;
    const dur = 1500;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <>
      {fmt(n)}
      {suffix}
    </>
  );
}

/**
 * Homepage hero. Rotating words with the brand colour cycling in sync (not
 * random — the colours come from SiteSetting.hero.colors), floating glass chips,
 * animated background blobs, count-up stats and a category-pill row. Respects
 * prefers-reduced-motion.
 */
export function Hero({ hero, stats = [] }) {
  // ── Derived / state ──
  const t = useT();
  const wordList = toList(hero?.words);
  const words = wordList.length ? wordList : toList(t("hero.defaultWords"));
  const colors = hero?.colors?.length ? hero.colors : ["#001478"];
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);
  const bgRef = useRef(null);

  // Admin siyahıları (boşdursa defolt)
  const leftPool = toList(hero?.chipsLeft);
  const rightPool = toList(hero?.chipsRight);
  const pills = toList(hero?.pills);
  // Boş olanda cari dilin defolt siyahısı işlənir.
  const poolL = leftPool.length ? leftPool : toList(t("hero.defaultChipsLeft"));
  const poolR = rightPool.length ? rightPool : toList(t("hero.defaultChipsRight"));
  const pillList = pills.length ? pills : toList(t("hero.defaultPills"));

  /**
   * SSR-də deterministik ilk N söz göstərilir, mount-dan SONRA təsadüfi
   * seçim tətbiq olunur. Render zamanı Math.random() çağırsaydıq server və
   * klient fərqli HTML verərdi → hidratasiya xətası (React #418).
   */
  const [chips, setChips] = useState(() => ({
    left: poolL.slice(0, SLOTS_LEFT.length),
    right: poolR.slice(0, SLOTS_RIGHT.length),
  }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- eyni səbəb: hidratasiya təhlükəsizliyi üçün qarışdırma mount-dan sonradır
    setChips({
      left: sample(poolL, SLOTS_LEFT.length),
      right: sample(poolR, SLOTS_RIGHT.length),
    });
    // Yalnız mount-da — hər səhifə açılışında bir dəfə qarışdırılır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effects ──
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefers-reduced-motion yalnız brauzerdə oxuna bilər
    setReduced(reduce);
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 3000);
    return () => clearInterval(t);
  }, [words.length]);

  const bg = colors[i % colors.length];

  // ── Render ──
  return (
    <section className="ba-hero" style={{ position: "relative", background: bg, overflow: "hidden", transition: "background .8s ease" }} ref={bgRef}>
      {/* re-animate the flip on each word change via key; hold visible with fill-mode */}
      <style>{`
        @media(max-width:820px){.ba-hero-mascot{display:none}}
        @keyframes ba-word-in {
          0%   { opacity:0; transform:translate(-50%,80%) rotateX(-80deg); }
          60%  { opacity:1; transform:translate(-50%,0) rotateX(0); }
          100% { opacity:1; transform:translate(-50%,0) rotateX(0); }
        }
      `}</style>

      {/* nth-of-type(1) — blob A (animated) */}
      <div style={{ position: "absolute", top: -100, left: "8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.22), transparent 68%)", filter: "blur(20px)", animation: reduced ? "none" : "ba-blobA 14s ease-in-out infinite", pointerEvents: "none" }} />
      {/* nth-of-type(2) — blob B (animated) */}
      <div style={{ position: "absolute", bottom: -120, right: "6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.16), transparent 68%)", filter: "blur(24px)", animation: reduced ? "none" : "ba-blobB 18s ease-in-out infinite", pointerEvents: "none" }} />
      {/* nth-of-type(3) — dot grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.18) 1.4px, transparent 1.4px)", backgroundSize: "26px 26px", WebkitMaskImage: "radial-gradient(circle at 50% 42%, transparent 24%, #000 80%)", maskImage: "radial-gradient(circle at 50% 42%, transparent 24%, #000 80%)", pointerEvents: "none" }} />

      {/* nth-of-type(4..9) — floating glass chips (direct children so tints apply) */}
      {[
        ...SLOTS_LEFT.map((sl, idx) => ({ ...sl, label: chips.left[idx], side: "l", idx })),
        ...SLOTS_RIGHT.map((sl, idx) => ({ ...sl, label: chips.right[idx], side: "r", idx })),
      ]
        .filter((c) => c.label)
        .map((c) => (
          // `ba-hero-chip` — dar ekranda gizlədilir (globals.css). Sinif
          // SARĞIDADIR, çünki rəng çalarları `nth-of-type(4..9)` ilə seçilir:
          // element sırası pozulmamalıdır, ona görə silmək yox, gizlətmək.
          <div key={`${c.side}${c.idx}`} className="ba-hero-chip" style={{ position: "absolute", ...c.pos, transform: `rotate(${c.rot}deg)`, pointerEvents: "none" }}>
            <span data-chip style={{ ...CHIP_STYLE, fontWeight: c.weight, animation: reduced ? "none" : c.anim }}>
              {c.label}
            </span>
          </div>
        ))}

      {/* mascot — /public/assets/mascot/hero.png (shows nothing if absent) */}
      <span
        aria-hidden="true"
        style={{ position: "absolute", right: "3%", bottom: 0, width: 240, height: "84%", maxHeight: 300, backgroundImage: "url(/assets/mascot/hero.png)", backgroundRepeat: "no-repeat", backgroundPosition: "bottom center", backgroundSize: "contain", filter: "drop-shadow(0 18px 30px rgba(0,0,0,.28))", pointerEvents: "none", zIndex: 0, animation: reduced ? "none" : "ba-mascot-bob 4.5s ease-in-out infinite", transformOrigin: "50% 100%" }}
        className="ba-hero-mascot"
      />

      {/* nth-of-type(10) — content */}
      <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto", padding: "78px 28px 66px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: "clamp(36px,5.2vw,56px)", lineHeight: 1.14, letterSpacing: "-.02em", color: "#fff", margin: 0 }}>
          {hero?.titlePrefix || "British Academy ilə"}<br />
          <span style={{ position: "relative", display: "inline-block", height: "1.2em", verticalAlign: "top", minWidth: 1 }}>
            <span
              key={reduced ? "static" : i}
              className="ba-rot-word"
              style={
                reduced
                  ? { opacity: 1, transform: "translate(-50%,0) rotateX(0)" }
                  : { animation: "ba-word-in .6s cubic-bezier(.2,.75,.25,1) forwards" }
              }
            >
              {words[i]}
            </span>
          </span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,.9)", maxWidth: 600, margin: "24px auto 0" }}>
          {hero?.subtitle || "British Academy ilə top universitetlərə qəbul ol."}
        </p>

        {stats.length > 0 && (
          <div className="hero-stats" style={{ display: "flex", justifyContent: "center", gap: 56, marginTop: 44, flexWrap: "wrap" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: "-.02em" }}>
                  <StatValue raw={s.value} />
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.82)", marginTop: 5, lineHeight: 1.35, maxWidth: 170 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 52 }}>
          {pillList.map((p) => (
            <a key={p} href="#kurslar" className="ba-pill-cat" style={PILL_BASE}>
              {p}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 44 }}>
          <ApplyButton className="ba-btn-primary" style={{ background: "#fff", color: "var(--accent)", border: "none", fontWeight: 700, fontSize: 15, padding: "14px 26px", borderRadius: 99, cursor: "pointer" }}>
            {t("hero.trialCta")}
          </ApplyButton>
        </div>
      </div>
    </section>
  );
}
