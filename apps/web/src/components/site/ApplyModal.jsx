"use client";

// React
import { memo, useCallback, useEffect, useState } from "react";
// Data (RTK Query)
import { useCreateLeadMutation } from "@/store/api/leadApi";
// Local
import { SiteSelect } from "./SiteSelect";
import { useT } from "@/lib/i18n/useT";
import { t as translate } from "@/lib/i18n/strings";

// ── Constants ──
// Maraq siyahısı tərcümə açarlarındandır — dəyər kimi AZ mətn göndərilir
// (admin panelində müraciətlər AZ oxunur), göstərilən etiket isə dilə görə.
/** Müraciətin `interest` dəyəri həmişə AZ yazılır ki, admin paneldə
 *  müraciətlər tək dildə oxunsun; istifadəçi öz dilində etiket görür. */
const tAz = (key) => translate("az", key);

const INTEREST_KEYS = [
  "apply.int.english",
  "apply.int.exams",
  "apply.int.russian",
  "apply.int.german",
  "apply.int.business",
  "apply.int.kids",
  "apply.int.abroad",
  "apply.int.computer",
];

const field = {
  border: "1.5px solid #E4E6EF",
  borderRadius: 13,
  padding: "15px 16px",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  color: "#14141C",
};

// ── Subcomponents ──
const ModalHeader = memo(function ModalHeader({ onClose }) {
  const t = useT();
  return (
    <div style={{ position: "relative", background: "var(--accent)", padding: "34px 34px 40px", overflow: "hidden" }}>
      <button onClick={onClose} className="ba-modal-close" style={{ position: "absolute", top: 20, right: 20, width: 38, height: 38, border: "none", borderRadius: "50%", background: "rgba(255,255,255,.22)", color: "#fff", cursor: "pointer", fontSize: 15 }}>✕</button>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: "9px 14px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/shield.png" alt="British Academy" style={{ height: 34, width: "auto" }} />
        <span style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, color: "#00157A" }}>British Academy</span>
      </div>
      <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 30, margin: "22px 0 0", color: "#fff" }}>{t("apply.title")}</h3>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,.92)", margin: "9px 0 0", lineHeight: 1.55, maxWidth: 370 }}>
        {t("apply.subtitle")}
      </p>
    </div>
  );
});

const SuccessCard = memo(function SuccessCard({ onClose }) {
  const t = useT();
  return (
    <div style={{ padding: "40px 34px", textAlign: "center" }}>
      <div style={{ fontSize: 46 }}>🎉</div>
      <h4 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 22, margin: "12px 0 8px", color: "#14141C" }}>{t("apply.successTitle")}</h4>
      <p style={{ color: "#63636F", fontSize: 15.5, margin: 0 }}>{t("apply.successText")}</p>
      <button onClick={onClose} className="ba-apply-btn" style={{ marginTop: 22, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 15, padding: "13px 28px", borderRadius: 13, cursor: "pointer" }}>{t("apply.close")}</button>
    </div>
  );
});

/** «Xaricdə təhsil» seçiminin AZ dəyəri — müraciətdə `interest` belə yazılır. */
const ABROAD = tAz("apply.int.abroad");

/**
 * Ölkə seçimi — çoxlu seçim, düymə şəklində.
 *
 * Açılan siyahı (select) əvəzinə düymələr işlədilir: ziyarətçi adətən bir neçə
 * ölkəyə baxır və hamısını bir ekranda görmək seçimi asanlaşdırır. Seçilmiş
 * ölkələr müraciətlə birlikdə göndərilir, ona görə operator ilk zəngdə hansı
 * istiqamətdən danışacağını bilir.
 */
const DestinationPicker = memo(function DestinationPicker({ destinations, selected, onToggle }) {
  const t = useT();
  if (!destinations.length) return null;
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#4A4A57", marginBottom: 9 }}>
        {t("apply.pickCountries")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {destinations.map((d) => {
          const on = selected.includes(d._id);
          return (
            <button
              key={d._id}
              type="button"
              onClick={() => onToggle(d._id)}
              aria-pressed={on}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                border: `1px solid ${on ? "var(--accent)" : "#E4E5EC"}`,
                background: on ? "var(--accent)" : "#fff",
                color: on ? "#fff" : "#4A4A57",
                borderRadius: 99,
                padding: "8px 15px",
                fontSize: 14,
                fontWeight: on ? 700 : 600,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all .18s",
              }}
            >
              {d.flag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.flag} alt="" width={18} height={13} style={{ borderRadius: 2, display: "block" }} />
              )}
              {d.country}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const ApplyForm = memo(function ApplyForm({ form, interest, setInterest, branch, setBranch, branches, destinations, picked, onTogglePick, error, isLoading, onChange, onSubmit }) {
  const t = useT();
  return (
    <form onSubmit={onSubmit} style={{ padding: "28px 34px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
      <input className="ba-field" name="name" required placeholder={t("apply.name")} value={form.name} onChange={onChange} style={field} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <input className="ba-field" name="phone" required placeholder={t("apply.phone")} value={form.phone} onChange={onChange} style={{ ...field, minWidth: 0 }} />
        <input className="ba-field" name="email" type="email" placeholder={t("apply.email")} value={form.email} onChange={onChange} style={{ ...field, minWidth: 0 }} />
      </div>
      <SiteSelect value={interest} onChange={setInterest} placeholder={t("apply.interest")} style={field} options={INTEREST_KEYS.map((k) => ({ value: tAz(k), label: t(k) }))} />

      {/* Ölkələr yalnız «Xaricdə təhsil» seçiləndə görünür — digər hallarda
          forma lüzumsuz uzanardı. */}
      {interest === ABROAD && (
        <DestinationPicker destinations={destinations} selected={picked} onToggle={onTogglePick} />
      )}

      {/* Xaricdə təhsildə filialın mənası yoxdur — müraciət ölkə üzrədir,
          dərs filialda keçilmir. */}
      {interest !== ABROAD && branches.length > 0 && (
        <SiteSelect value={branch} onChange={setBranch} placeholder={t("apply.branch")} style={field} options={branches.map((b) => ({ value: b._id, label: b.name }))} />
      )}
      {error && <div style={{ color: "#E0533D", fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
      <button type="submit" disabled={isLoading} className="ba-apply-btn" style={{ marginTop: 6, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, padding: 16, borderRadius: 13, cursor: "pointer", opacity: isLoading ? 0.7 : 1 }}>
        {isLoading ? t("apply.sending") : t("apply.submit")}
      </button>
      <p style={{ textAlign: "center", fontSize: 12.5, color: "#63636E", margin: 0 }}>{t("apply.privacy")}</p>
    </form>
  );
});

export function ApplyModal({ open, onClose, preset, project, branches = [], destinations = [] }) {
  const t = useT();
  // ── Data / state ──
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [interest, setInterest] = useState("");
  const [branch, setBranch] = useState("");
  const [picked, setPicked] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // ── Effects ──
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- modal açılanda forma vəziyyəti sıfırlanır (prop dəyişikliyinə reaksiya)
      setDone(false);
      setError("");
      setInterest(preset || "");
      setBranch("");
      setPicked([]);
    }
  }, [open, preset]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── Handlers ──
  const change = useCallback((e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value })), []);

  // Maraq «Xaricdə təhsil»ə keçəndə seçilmiş filial təmizlənir — sahə
  // gizlənir, amma dəyər formada qalıb müraciətlə göndərilərdi.
  const changeInterest = useCallback((v) => {
    setInterest(v);
    if (v === ABROAD) setBranch("");
  }, []);

  const togglePick = useCallback((id) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createLead({
        ...form,
        interest,
        branch: branch || undefined,
        // Yalnız «Xaricdə təhsil» seçiləndə göndərilir — başqa hallarda
        // istifadəçi ölkə seçmir, seçim isə ekranda qalmış ola bilər.
        destinations: interest === ABROAD && picked.length ? picked : undefined,
        // Layihə səhifəsindən açılıbsa müraciət ona bağlanır.
        project: project || undefined,
        source: "apply-modal",
        pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(err?.data?.message || t("apply.error"));
    }
  }, [createLead, form, interest, branch, picked, project, t]);

  const onOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  // ── Render ──
  return (
    <div
      onClick={onOverlayClick}
      style={{ display: "flex", position: "fixed", inset: 0, zIndex: 150, background: "rgba(12,13,26,.55)", backdropFilter: "blur(4px)", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: 26, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.45)" }}>
        <ModalHeader onClose={onClose} />

        {done ? (
          <SuccessCard onClose={onClose} />
        ) : (
          <ApplyForm
            form={form}
            interest={interest}
            setInterest={changeInterest}
            branch={branch}
            setBranch={setBranch}
            branches={branches}
            destinations={destinations}
            picked={picked}
            onTogglePick={togglePick}
            error={error}
            isLoading={isLoading}
            onChange={change}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}
