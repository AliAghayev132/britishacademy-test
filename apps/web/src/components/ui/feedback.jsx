"use client";

// ── Custom feedback system ──
// Toasts + confirm + alert dialogs, all brand-styled, no third-party lib.
// Imperative API (works from anywhere, like SweetAlert) backed by a tiny
// pub/sub store; a single <FeedbackHost/> (mounted in the dashboard layout)
// renders everything through a portal.

// React
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
// Icons
import { CheckCircle2, XCircle, Info, AlertTriangle, HelpCircle, X } from "lucide-react";

// ── Store ──
let toasts = [];
let dialog = null;
let seq = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l));

function pushToast(type, message, opts = {}) {
  const id = ++seq;
  toasts = [...toasts, { id, type, message, duration: opts.duration ?? 3400 }];
  emit();
  return id;
}
function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** notify.success("...") / .error / .info / .warning */
export const notify = {
  success: (m, o) => pushToast("success", m, o),
  error: (m, o) => pushToast("error", m, o),
  info: (m, o) => pushToast("info", m, o),
  warning: (m, o) => pushToast("warning", m, o),
};

/** confirmDialog({title, text, confirmText, cancelText, tone}) → Promise<boolean> */
export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    dialog = { kind: "confirm", resolve, tone: "warning", ...opts };
    emit();
  });
}
/** alertDialog({title, text, tone}) → Promise<void> */
export function alertDialog(opts = {}) {
  return new Promise((resolve) => {
    dialog = { kind: "alert", resolve, tone: "info", ...opts };
    emit();
  });
}
function closeDialog(result) {
  const d = dialog;
  dialog = null;
  emit();
  d?.resolve(result);
}

// ── Visuals ──
const TONES = {
  success: { Icon: CheckCircle2, color: "#12915b", bg: "#e9f7f0" },
  error: { Icon: XCircle, color: "#B00E28", bg: "#fdeaed" },
  warning: { Icon: AlertTriangle, color: "#b7791f", bg: "#fdf4e3" },
  info: { Icon: Info, color: "#00157A", bg: "#eaeefb" },
  question: { Icon: HelpCircle, color: "#00157A", bg: "#eaeefb" },
};

function ToastItem({ t, onClose }) {
  const [leaving, setLeaving] = useState(false);
  const tone = TONES[t.type] || TONES.info;
  const { Icon } = tone;
  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), t.duration);
    const b = setTimeout(() => onClose(t.id), t.duration + 220);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [t.id, t.duration, onClose]);
  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, width: 340, maxWidth: "90vw",
        background: "#fff", borderRadius: 14, padding: "13px 14px",
        boxShadow: "0 14px 40px rgba(20,20,45,.16)", border: "1px solid #eceef4",
        borderLeft: `4px solid ${tone.color}`,
        transform: leaving ? "translateX(120%)" : "translateX(0)",
        opacity: leaving ? 0 : 1, transition: "transform .22s ease, opacity .22s ease",
      }}
    >
      <span style={{ width: 30, height: 30, flex: "none", borderRadius: 9, background: tone.bg, color: tone.color, display: "grid", placeItems: "center" }}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45, color: "#1c1c26", paddingTop: 4 }}>{t.message}</span>
      <button onClick={() => onClose(t.id)} style={{ color: "#63636E", padding: 2 }} aria-label="Bağla"><X className="h-4 w-4" /></button>
    </div>
  );
}

function DialogModal({ dialog, onClose }) {
  const okRef = useRef(null);
  const isConfirm = dialog.kind === "confirm";
  const tone = TONES[dialog.tone] || TONES.info;
  const { Icon } = tone;
  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose(isConfirm ? false : undefined);
      if (e.key === "Enter") onClose(isConfirm ? true : undefined);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isConfirm, onClose]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose(isConfirm ? false : undefined)}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(12,13,26,.55)", backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20 }}
    >
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, boxShadow: "0 40px 100px rgba(0,0,0,.4)", overflow: "hidden", animation: "ba-pop .18s ease" }}>
        <div style={{ padding: "28px 26px 22px", textAlign: "center" }}>
          <span style={{ width: 58, height: 58, margin: "0 auto 16px", borderRadius: 16, background: tone.bg, color: tone.color, display: "grid", placeItems: "center" }}>
            <Icon className="h-7 w-7" />
          </span>
          {dialog.title && <h3 style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 20, color: "#14141c", margin: 0 }}>{dialog.title}</h3>}
          {dialog.text && <p style={{ fontSize: 14.5, color: "#5a5a66", margin: "10px 0 0", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: dialog.text }} />}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 26px 24px", justifyContent: "center" }}>
          {isConfirm && (
            <button
              onClick={() => onClose(false)}
              style={{ flex: 1, maxWidth: 160, padding: "12px 18px", borderRadius: 12, border: "1px solid #e4e6ef", background: "#fff", color: "#54545f", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}
            >
              {dialog.cancelText || "İmtina"}
            </button>
          )}
          <button
            ref={okRef}
            onClick={() => onClose(isConfirm ? true : undefined)}
            style={{ flex: 1, maxWidth: 160, padding: "12px 18px", borderRadius: 12, border: "none", background: dialog.tone === "error" || dialog.tone === "warning" ? "#B00E28" : "var(--accent, #00157A)", color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}
          >
            {dialog.confirmText || (isConfirm ? "Təsdiq et" : "Bağla")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Host (mount once) ──
export function FeedbackHost() {
  const [, force] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal yalnız mount-dan sonra render oluna bilər
    setMounted(true);
    return subscribe(() => force((n) => n + 1));
  }, []);
  if (!mounted) return null;
  return createPortal(
    <>
      <style>{`@keyframes ba-pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ position: "fixed", top: 18, right: 18, zIndex: 110, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem t={t} onClose={dismissToast} />
          </div>
        ))}
      </div>
      {dialog && <DialogModal dialog={dialog} onClose={closeDialog} />}
    </>,
    document.body,
  );
}
