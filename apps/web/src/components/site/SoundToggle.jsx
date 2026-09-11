"use client";

// React
import { useEffect, useSyncExternalStore } from "react";
// Local
import { isSfxOn, setSfxOn, subscribeSfx, unlockSfx, playSfx } from "@/lib/sfx";
import { useT } from "@/lib/i18n/useT";

const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"];

/**
 * Səs effektlərini aç/söndür düyməsi (sol aşağı künc — sağda WhatsApp var).
 * Həm də səs kontekstini istifadəçinin ilk toxunuşunda açır: brauzer ondan
 * əvvəl səs çalmağa icazə vermir.
 */
export function SoundToggle() {
  const t = useT();
  // Server-də həmişə «açıq»; klientdə localStorage-dəki seçim.
  const on = useSyncExternalStore(subscribeSfx, isSfxOn, () => true);

  useEffect(() => {
    const unlock = () => unlockSfx();
    const opts = { capture: true, passive: true };
    UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, unlock, opts));
    return () => UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock, opts));
  }, []);

  const toggle = () => {
    const next = !on;
    setSfxOn(next);
    if (next) {
      unlockSfx();
      playSfx("tap");
    }
  };

  const label = on ? t("sfx.off") : t("sfx.on");
  return (
    <button type="button" onClick={toggle} className="ba-sfx-btn" aria-pressed={on} aria-label={label} title={label}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {on ? (
          <>
            <path className="ba-sfx-wave" d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path className="ba-sfx-wave ba-sfx-wave2" d="M19 5a10 10 0 0 1 0 14" />
          </>
        ) : (
          <>
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        )}
      </svg>
    </button>
  );
}
