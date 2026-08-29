"use client";

// ── Public custom select ──
// Inline-styled dropdown for the public forms (matches .ba-field). Custom option
// design; lists longer than 5 get a search box. onChange receives the value
// directly. Fixed-positioned menu so it never clips inside a modal.

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/useT";

const optStyle = {
  display: "block", width: "100%", textAlign: "left", padding: "11px 15px",
  fontSize: 15, fontFamily: "inherit", border: "none", cursor: "pointer",
};

export function SiteSelect({ value, onChange, options = [], placeholder, style }) {
  const t = useT();
  // Defolt parametrdə hook çağırmaq olmaz — burada həll edilir.
  const ph = placeholder || t("common.select");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [coords, setCoords] = useState(null);
  const tRef = useRef(null);
  const mRef = useRef(null);

  const searchable = options.length > 5;
  const sel = options.find((o) => String(o.value) === String(value ?? ""));

  useEffect(() => {
    if (!open) return;
    const f = (e) => {
      if (tRef.current?.contains(e.target) || mRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", f);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", f); document.removeEventListener("keydown", k); };
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(false);
    const r = tRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    setCoords({ left: r.left, width: r.width, top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined });
    setQ("");
    setOpen(true);
  };
  const pick = (v) => { onChange?.(v); setOpen(false); };
  const filtered = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button ref={tRef} type="button" onClick={toggle} className="ba-field" style={{ ...style, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", textAlign: "left" }}>
        <span style={{ color: sel ? "#14141C" : "#63636E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel ? sel.label : ph}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#63636E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && coords && (
        <div ref={mRef} style={{ position: "fixed", left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom, zIndex: 200, background: "#fff", border: "1px solid #E4E6EF", borderRadius: 13, boxShadow: "0 16px 40px rgba(20,20,45,.18)", overflow: "hidden" }}>
          {searchable && (
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #EEF0F4" }}>
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.searchShort")} style={{ width: "100%", border: "none", outline: "none", fontSize: 14.5, fontFamily: "inherit", color: "#14141C" }} />
            </div>
          )}
          <div style={{ maxHeight: 230, overflowY: "auto", padding: "4px 0" }}>
            {ph && <button type="button" onClick={() => pick("")} style={{ ...optStyle, background: "transparent", color: "#63636E", fontWeight: 500 }}>{ph}</button>}
            {filtered.map((o) => {
              const on = String(o.value) === String(value ?? "");
              return (
                <button key={o.value} type="button" onClick={() => pick(o.value)} style={{ ...optStyle, background: on ? "var(--accent-soft)" : "transparent", color: on ? "var(--accent)" : "#1C1C26", fontWeight: on ? 700 : 500 }}>{o.label}</button>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: 12, textAlign: "center", color: "#63636E", fontSize: 14 }}>{t("common.notFound")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
