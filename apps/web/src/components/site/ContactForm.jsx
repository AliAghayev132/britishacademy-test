"use client";

import { useState } from "react";
import { useCreateLeadMutation } from "@/store/api/leadApi";

export function ContactForm({ branches = [] }) {
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [branch, setBranch] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createLead({
        ...form,
        branch: branch || undefined,
        source: "contact-page",
        pageUrl: "/elaqe",
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(err?.data?.message || "Xəta baş verdi. Yenidən cəhd et.");
    }
  };

  if (done) {
    return (
      <div style={{ border: "1px solid #ECEDF2", borderRadius: 22, padding: 40, background: "#FAFBFF", textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>🎉</div>
        <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, margin: "12px 0 8px", color: "#14141C" }}>Mesajın göndərildi!</h3>
        <p style={{ color: "#63636F", fontSize: 15.5, margin: 0 }}>Tezliklə səninlə əlaqə saxlayacağıq.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ border: "1px solid #ECEDF2", borderRadius: 22, padding: 30, background: "#FAFBFF", display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 24, color: "#14141C", margin: "0 0 6px" }}>Bizə yaz</h2>
      <input className="ba-field" name="name" required placeholder="Ad Soyad" value={form.name} onChange={change} style={field} />
      <input className="ba-field" name="phone" required placeholder="Telefon" value={form.phone} onChange={change} style={field} />
      <input className="ba-field" name="email" type="email" placeholder="E-poçt" value={form.email} onChange={change} style={field} />
      {branches.length > 0 && (
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="ba-field" style={{ ...field, cursor: "pointer" }}>
          <option value="">Filial seç (istəyə bağlı)</option>
          {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      )}
      <textarea className="ba-field" name="message" rows={4} placeholder="Mesajın" value={form.message} onChange={change} style={{ ...field, resize: "vertical" }} />
      {error && <div style={{ color: "#E0533D", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
      <button type="submit" disabled={isLoading} className="ba-apply-btn" style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: 15, borderRadius: 13, cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
        {isLoading ? "Göndərilir…" : "Göndər"}
      </button>
    </form>
  );
}

const field = {
  border: "1.5px solid #E4E6EF",
  borderRadius: 13,
  padding: "14px 16px",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  color: "#14141C",
  background: "#fff",
};
