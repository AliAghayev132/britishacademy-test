"use client";

// React
import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialoqun klaviatura davranışı (audit #34):
 *  - açılanda fokus içəriyə keçir (initialFocus və ya ilk fokuslanan element);
 *  - Tab/Shift+Tab dialoqdan çıxmır (dialoqun öz portalı — `data-dialog-portal`
 *    ilə işarələnmiş açılan siyahı — istisnadır);
 *  - arxadakı səhifə sürüşmür;
 *  - bağlananda fokus açan elementə qayıdır;
 *  - `onEscape` verilsə Escape onu çağırır.
 *
 * Əvvəl müraciət modalında fokus arxadakı səhifədə qalırdı: klaviatura və
 * ekran oxuyucu istifadəçisi formanı tapa bilmir, Tab görünməyən linklərə
 * gedirdi.
 *
 * @returns {React.RefObject} dialoq konteynerinə verilən ref
 */
export function useDialogFocus(open, { initialFocus, onEscape, lockScroll = true } = {}) {
  const ref = useRef(null);
  const escRef = useRef(onEscape);
  useEffect(() => {
    escRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) return undefined;
    const node = ref.current;
    const previous = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(node?.querySelectorAll(FOCUSABLE) || []).filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[inert]"),
      );

    const timer = setTimeout(() => {
      if (node?.contains(document.activeElement)) return;
      const target = initialFocus?.current || focusables()[0] || node;
      target?.focus?.({ preventScroll: true });
    }, 30);

    const onKey = (e) => {
      if (e.key === "Escape" && escRef.current) {
        escRef.current();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      // Açılan siyahı <body>-yə portal edilir (ata elementin transform-u onu
      // yerindən oynadır). DOM-da dialoqdan kənarda olsa da məntiqən onun
      // içindədir: tələ qarışmasın, yoxsa Tab bəndlərə çatmadan formaya
      // qaytarırdı.
      if (document.activeElement?.closest?.("[data-dialog-portal]")) return;
      const items = focusables();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = node.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      if (previous && typeof previous.focus === "function" && document.contains(previous)) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open, initialFocus, lockScroll]);

  return ref;
}
