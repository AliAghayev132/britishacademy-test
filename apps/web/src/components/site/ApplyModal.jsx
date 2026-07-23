"use client";

import { useEffect, useState } from "react";
import { useCreateLeadMutation } from "@/store/api/leadApi";

const INTERESTS = [
  "İngilis dili",
  "IELTS · TOEFL",
  "Rus dili",
  "Alman dili",
  "Biznes İngilis",
  "Uşaqlar üçün",
  "Xaricdə təhsil",
  "Kompüter kursları",
];

export function ApplyModal({ open, onClose, preset }) {
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [interest, setInterest] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDone(false);
      setError("");
      setInterest(preset || "");
    }
  }, [open, preset]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createLead({
        ...form,
        interest,
        source: "apply-modal",
        pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi. Yenidən cəhd et.");
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ display: "flex", position: "fixed", inset: 0, zIndex: 150, background: "rgba(12,13,26,.55)", backdropFilter: "blur(4px)", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.45)" }}>
        <div style={{ position: "relative", background: "var(--accent)", padding: "34px 34px 40px", overflow: "hidden" }}>
          <button onClick={onClose} className="ba-modal-close" style={{ position: "absolute", top: 20, right: 20, width: 38, height: 38, border: "none", borderRadius: "50%", background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer", fontSize: 15 }}>✕</button>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: "9px 14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/shield.png" alt="British Academy" style={{ height: 34, width: "auto" }} />
            <span style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, color: "#00157A" }}>British Academy</span>
          </div>
          <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 30, margin: "22px 0 0", color: "#fff" }}>Müraciət et</h3>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.92)", margin: "9px 0 0", lineHeight: 1.55, maxWidth: 370 }}>
            Gələcəyinə bu gün başla — dil biliyini British Academy ilə növbəti səviyyəyə qaldır.
          </p>
        </div>

        {done ? (
          <div style={{ padding: "40px 34px", textAlign: "center" }}>
            <div style={{ fontSize: 46 }}>🎉</div>
            <h4 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, margin: "12px 0 8px", color: "#14141C" }}>Müraciətin qəbul edildi!</h4>
            <p style={{ color: "#63636F", fontSize: 15.5, margin: 0 }}>Tezliklə səninlə əlaqə saxlayacağıq.</p>
            <button onClick={onClose} className="ba-apply-btn" style={{ marginTop: 22, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, padding: "13px 28px", borderRadius: 13, cursor: "pointer" }}>Bağla</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ padding: "28px 34px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <input className="ba-field" name="name" required placeholder="Ad Soyad" value={form.name} onChange={change} style={field} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <input className="ba-field" name="phone" required placeholder="Telefon" value={form.phone} onChange={change} style={{ ...field, minWidth: 0 }} />
              <input className="ba-field" name="email" type="email" placeholder="E-poçt" value={form.email} onChange={change} style={{ ...field, minWidth: 0 }} />
            </div>
            <select value={interest} onChange={(e) => setInterest(e.target.value)} className="ba-field" style={{ ...field, cursor: "pointer" }}>
              <option value="">Nəyə müraciət edirsən?</option>
              {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {error && <div style={{ color: "#E0533D", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
            <button type="submit" disabled={isLoading} className="ba-apply-btn" style={{ marginTop: 6, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: 16, borderRadius: 13, cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? "Göndərilir…" : "Müraciəti göndər"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12.5, color: "#9A9AA6", margin: 0 }}>Məlumatların üçüncü tərəflə paylaşılmır.</p>
          </form>
        )}
      </div>
    </div>
  );
}

const field = {
  border: "1.5px solid #E4E6EF",
  borderRadius: 13,
  padding: "15px 16px",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  color: "#14141C",
};
