"use client";

// React
import { useSyncExternalStore } from "react";

// Lib
import { getConsent, resetConsent, CONSENT_EVENT } from "@/lib";

const subscribe = (cb) => {
  window.addEventListener(CONSENT_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CONSENT_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const clientSnapshot = () => getConsent() ?? "none";
const serverSnapshot = () => "ssr";

/**
 * Məxfilik səhifəsində reklam ölçməsi seçiminin vəziyyəti və onu dəyişmək.
 * «Seçimi dəyiş» seçimi sıfırlayır — razılıq banneri yenidən çıxır.
 * Mətnlər səhifədən gəlir (content.js), ona görə burada tərcümə yoxdur.
 */
export function ConsentControl({ title, granted, denied, none, reset }) {
  const choice = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (choice === "ssr") return null;
  const state = choice === "granted" ? granted : choice === "denied" ? denied : none;

  return (
    <div className="ba-consent-control">
      <div>
        <div className="ba-consent-control-title">{title}</div>
        <div className="ba-consent-control-state">{state}</div>
      </div>
      {choice !== "none" && (
        <button type="button" className="ba-consent-btn ba-consent-btn--ghost" onClick={resetConsent}>
          {reset}
        </button>
      )}
    </div>
  );
}
