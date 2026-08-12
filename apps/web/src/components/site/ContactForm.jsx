"use client";

// React
import { memo, useCallback, useState } from "react";
// Data (RTK Query)
import { useCreateLeadMutation } from "@/store/api/leadApi";
// Local
import { SiteSelect } from "./SiteSelect";
import { useT } from "@/lib/i18n/useT";

// ── Constants ──
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

// ── Subcomponents ──
const SuccessCard = memo(function SuccessCard() {
  const t = useT();
  return (
    <div style={{ border: "1px solid #ECEDF2", borderRadius: 22, padding: 40, background: "#FAFBFF", textAlign: "center" }}>
      <div style={{ fontSize: 44 }}>🎉</div>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, margin: "12px 0 8px", color: "#14141C" }}>{t("contact.sent")}</h3>
      <p style={{ color: "#63636F", fontSize: 15.5, margin: 0 }}>{t("contact.sentText")}</p>
    </div>
  );
});

export function ContactForm({ branches = [] }) {
  // ── Data / state ──
  const t = useT();
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [branch, setBranch] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // ── Handlers ──
  const change = useCallback((e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value })), []);

  const submit = useCallback(async (e) => {
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
      setError(err?.data?.message || t("contact.error"));
    }
  }, [createLead, form, branch]);

  // ── Render ──
  if (done) {
    return <SuccessCard />;
  }

  return (
    <form onSubmit={submit} style={{ border: "1px solid #ECEDF2", borderRadius: 22, padding: 30, background: "#FAFBFF", display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 24, color: "#14141C", margin: "0 0 6px" }}>{t("contact.write")}</h2>
      <input className="ba-field" name="name" required placeholder={t("apply.name")} value={form.name} onChange={change} style={field} />
      <input className="ba-field" name="phone" required placeholder={t("apply.phone")} value={form.phone} onChange={change} style={field} />
      <input className="ba-field" name="email" type="email" placeholder={t("apply.email")} value={form.email} onChange={change} style={field} />
      {branches.length > 0 && (
        <SiteSelect value={branch} onChange={setBranch} placeholder={t("contact.branchOpt")} style={field} options={branches.map((b) => ({ value: b._id, label: b.name }))} />
      )}
      <textarea className="ba-field" name="message" rows={4} placeholder={t("contact.message")} value={form.message} onChange={change} style={{ ...field, resize: "vertical" }} />
      {error && <div style={{ color: "#E0533D", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
      <button type="submit" disabled={isLoading} className="ba-apply-btn" style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: 15, borderRadius: 13, cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
        {isLoading ? t("apply.sending") : t("contact.send")}
      </button>
    </form>
  );
}
