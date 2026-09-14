"use client";

// React
import { useEffect, useRef } from "react";

/**
 * Açıq paneli kənara toxunanda və Escape-də bağla.
 *
 * Bu məntiq 11 komponentdə (seçim qutuları, əməliyyat menyusu, tarix seçici,
 * dil menyusu, redaktorun 5 popover-i) əl ilə təkrarlanırdı və fərqlənirdi:
 * redaktor menyuları Escape-ə cavab vermirdi, bəziləri portal panelini
 * «kənar» sayıb içinə klikdə bağlanırdı.
 *
 * @param {boolean} active     panel açıqdır (false olanda dinləyici yoxdur)
 * @param {(e: Event) => void} onDismiss
 * @param {object|object[]} refs  «içəri» sayılan elementlərin ref-ləri
 *                                (məs. düymə + portal ilə render olunan panel)
 * @param {{ escape?: boolean, event?: "mousedown" | "pointerdown" }} [options]
 */
export function useDismiss(active, onDismiss, refs, { escape = true, event = "mousedown" } = {}) {
  // Son callback və ref siyahısı — effekt hər renderdə yenidən qoşulmasın.
  const latest = useRef({ onDismiss, refs });
  useEffect(() => {
    latest.current = { onDismiss, refs };
  });

  useEffect(() => {
    if (!active) return undefined;
    const inside = (target) => {
      const list = [].concat(latest.current.refs || []);
      return list.some((r) => r?.current && r.current.contains(target));
    };
    const onDown = (e) => {
      if (!inside(e.target)) latest.current.onDismiss(e);
    };
    const onKey = (e) => {
      if (e.key === "Escape") latest.current.onDismiss(e);
    };
    document.addEventListener(event, onDown);
    if (escape) document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener(event, onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active, escape, event]);
}
