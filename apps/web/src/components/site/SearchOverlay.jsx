"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocaleLink as Link } from "./LocaleLink";
import { useLocale } from "./LocaleProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Full-screen search overlay mirroring the static site's #ba-search-overlay.
 * Loads the public course list once (on first open) via the shared api helper,
 * then does a simple client-side substring filter over title/excerpt/category
 * and links matches to /kurslar/<slug>. Escape or backdrop click closes it.
 */
export function SearchOverlay({ open, onClose }) {
  const locale = useLocale();
  const [courses, setCourses] = useState(null); // null = not yet loaded
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const loadedRef = useRef(false);

  // Fetch the course list once, lazily on first open (cari dildə).
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    let alive = true;
    fetch(`${API_URL}/api/courses?lang=${locale}`, { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((j) => {
        if (alive) setCourses(Array.isArray(j?.data?.courses) ? j.data.courses : []);
      })
      .catch(() => alive && setCourses([]));
    return () => {
      alive = false;
    };
  }, [open, locale]);

  // Focus the input and wire Escape-to-close while open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const term = q.trim();
  const results = useMemo(() => {
    const needle = term.toLowerCase();
    if (!needle || !courses) return [];
    return courses
      .filter((c) => {
        const hay = `${c.title || ""} ${c.excerpt || ""} ${c.category?.name || ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 30);
  }, [term, courses]);

  if (!open) return null;

  const showEmpty = term && courses && results.length === 0;

  return (
    <div
      className="ba-search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Axtarış"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(255,255,255,.98)",
        backdropFilter: "blur(10px)",
        padding: "36px 24px",
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 22, color: "#14141C" }}>Axtarış</span>
          <button
            type="button"
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 600, fontSize: 14, padding: "9px 16px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}
          >
            Bağla ✕
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, border: "2px solid var(--accent)", borderRadius: 16, padding: "15px 18px", background: "#fff" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: "var(--accent)", flex: "none" }} aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kurs, xəbər və ya proqram axtar..."
            autoComplete="off"
            style={{ border: "none", outline: "none", fontSize: 19, width: "100%", background: "transparent", color: "#14141C", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {results.map((c, i) => (
            <Link
              key={c._id || c.slug}
              href={`/kurslar/${c.slug}`}
              onClick={onClose}
              className="ba-sr-item"
              style={{ display: "flex", flexDirection: "column", gap: 2, textDecoration: "none", border: "1px solid #ECEDF2", borderRadius: 14, padding: "14px 16px", background: "#fff", color: "#14141C", animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <span style={{ fontWeight: 700, fontSize: 16 }}>{c.title}</span>
              {c.category?.name && <span style={{ fontSize: 13, color: "#8A8A96" }}>{c.category.name}</span>}
            </Link>
          ))}
        </div>

        {showEmpty && (
          <div style={{ textAlign: "center", color: "#63636E", padding: 28, fontSize: 16 }}>Nəticə tapılmadı</div>
        )}
      </div>
    </div>
  );
}
