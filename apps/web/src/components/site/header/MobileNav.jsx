"use client";

// Lib
import { useT } from "@/lib";

// Local
import { useDialogFocus } from "../useDialogFocus";
import MobileNavItem from "./MobileNavItem";

/** Mobil menyu pərdəsi — nav bəndləri, axtarış və müraciət düymələri. */
export default function MobileNav({ mobile, nav, services, destinations, onClose, onSearch, onApply }) {
  const t = useT();
  // Açıq menyuda fokus içəridə qalır, Escape bağlayır, səhifə arxada sürüşmür.
  const mobileRef = useDialogFocus(mobile, { onEscape: onClose });

  return (
    /* Bağlı olanda `inert`: ekrandan kənardakı linklərə Tab ilə düşülmürdü (audit #34). */
    <div className={`ba-mnav${mobile ? " open" : ""}`} onClick={onClose} inert={!mobile}>
      <div
        ref={mobileRef}
        id="ba-mobile-nav"
        className="ba-mnav-inner"
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
        onClick={(e) => e.stopPropagation()}
      >
        {nav.map((item) => (
          <MobileNavItem
            key={item.label}
            item={item}
            services={services}
            destinations={destinations}
            onClose={onClose}
          />
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => { onClose(); onSearch(); }}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F1F2F6", border: "1px solid #E7E8EE", color: "#4C4C58", fontWeight: 700, fontSize: 14.5, padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            {t("nav.search")}
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onApply(); }}
            className="ba-apply-btn"
            style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 700, fontSize: 14.5, padding: "12px 16px", borderRadius: 12, cursor: "pointer" }}
          >
            {t("nav.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
