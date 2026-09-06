"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { LocaleLink as Link } from "./LocaleLink";
import { useLocale } from "./LocaleProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Tam ekran axtarış pəncərəsi.
 *
 * ƏVVƏL: yalnız KURSLAR tapılırdı və o da client tərəfdə — bütün kurs siyahısı
 * yüklənib brauzerdə süzülürdü. Ziyarətçi bloq yazısını, layihəni və ya testi
 * axtaranda «tapılmadı» alırdı.
 *
 * İNDİ: `/api/search` səkkiz mənbəni bir sorğuda axtarır (kurslar, bloq,
 * layihələr, testlər, xaricdə təhsil, müəllimlər, filiallar, səhifələr) və
 * nəticələr növə görə qruplaşdırılmış gəlir. Axtarış SERVERDƏDİR: hər
 * kolleksiyanı brauzerə yükləmək meqabaytlarla trafik olardı.
 *
 * Yazı yazıldıqca sorğu göndərilmir — 250 ms fasilə gözlənilir (debounce),
 * əks halda hər hərf ayrıca sorğu yaradardı.
 */
export function SearchOverlay({ open, onClose }) {
  const t = useT();
  const locale = useLocale();
  const [q, setQ] = useState("");
  // Nəticə HANSI sorğuya aid olduğu ilə birlikdə saxlanılır. «Yüklənir» halı
  // bundan HESABLANIR — ayrıca bayraq saxlasaydıq, effektin içində sinxron
  // setState olardı (qısa sorğuda sıfırlamaq üçün).
  const [result, setResult] = useState({ term: "", groups: null });
  const inputRef = useRef(null);

  const term = q.trim();
  const ready = result.term === term;
  const groups = ready ? result.groups : null;
  const loading = term.length >= 2 && !ready;

  // Serverdə axtar — 250 ms fasilə ilə (hər hərfə sorğu getməsin).
  useEffect(() => {
    if (!open || term.length < 2) return undefined;
    let alive = true;
    const id = setTimeout(() => {
      fetch(`${API_URL}/api/search?q=${encodeURIComponent(term)}&lang=${locale}`, {
        headers: { Accept: "application/json" },
      })
        .then((r) => r.json())
        .then((j) => {
          if (alive) setResult({ term, groups: Array.isArray(j?.data?.groups) ? j.data.groups : [] });
        })
        .catch(() => alive && setResult({ term, groups: [] }));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [open, term, locale]);

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

  if (!open) return null;

  const total = (groups || []).reduce((n, g) => n + g.items.length, 0);
  const showEmpty = term.length >= 2 && !loading && groups !== null && total === 0;

  return (
    <div
      className="ba-search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("search.title")}
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
          <span style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 22, color: "#14141C" }}>{t("search.title")}</span>
          <button
            type="button"
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 600, fontSize: 14, padding: "9px 16px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t("common.close")} ✕
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
            placeholder={t("search.placeholder")}
            autoComplete="off"
            style={{ border: "none", outline: "none", fontSize: 19, width: "100%", background: "transparent", color: "#14141C", fontFamily: "inherit" }}
          />
        </div>

        {/* Nəticələr növə görə qruplaşdırılır — ziyarətçi tapdığı şeyin
            kurs, bloq yazısı, yoxsa test olduğunu dərhal görsün. */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 22 }}>
          {(groups || []).map((g) => (
            <div key={g.key}>
              <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#8A8A96", marginBottom: 8 }}>
                {g.label}
                <span style={{ marginLeft: 8, fontWeight: 700, color: "#B4B4BE" }}>{g.items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map((it, i) => (
                  <Link
                    key={it._id || it.href}
                    href={it.href}
                    onClick={onClose}
                    className="ba-sr-item"
                    style={{ display: "flex", flexDirection: "column", gap: 2, textDecoration: "none", border: "1px solid #ECEDF2", borderRadius: 14, padding: "13px 16px", background: "#fff", color: "#14141C", animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{it.title}</span>
                    {it.sub && (
                      <span style={{ fontSize: 13, color: "#8A8A96", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.sub}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {loading && term.length >= 2 && (
          <div style={{ textAlign: "center", color: "#8A8A96", padding: 24, fontSize: 15 }}>
            {t("common.loading")}…
          </div>
        )}

        {showEmpty && (
          <div style={{ textAlign: "center", color: "#63636E", padding: 28, fontSize: 16 }}>{t("search.empty")}</div>
        )}
      </div>
    </div>
  );
}
