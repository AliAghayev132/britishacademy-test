"use client";

// React
import { memo, useRef, useState } from "react";

// Hooks
import { useDismiss } from "@/hooks";

// Lib
import { useT } from "@/lib";

// Local
import useLangSwitch from "./useLangSwitch";

// ── Dillər ──
// Ad öz dilində yazılır (endonim): rus dilli ziyarətçi «Rus dili» yox,
// «Русский» axtarır.
const LANGS = [
  { code: "az", label: "AZ", name: "Azərbaycan" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
];

/**
 * Mobil dil seçicisi — hamburger düyməsinin yanında dropdown.
 *
 * Masaüstündə dil üst lentdədir, lakin o lent mobildə gizlədilir: e-poçt,
 * telefon, iş saatı və üç dil düyməsi dar ekranda alt-alta düşüb header-i
 * ikiqat hündürlüyə çıxarırdı. Dil seçimi isə lazımdır, ona görə bura
 * yığcam dropdown kimi köçürüldü.
 */
const LanguageMenu = memo(function LanguageMenu() {
  const { locale, go } = useLangSwitch();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Kənara toxunanda və Escape-də bağlan. `pointerdown` — `click` gec
  // işləyir və menyu açıq qalmış görünür.
  useDismiss(open, () => setOpen(false), ref, { event: "pointerdown" });

  const current = LANGS.find((l) => l.code === locale) || LANGS[0];

  return (
    <div className="ba-langmenu" ref={ref}>
      <button
        type="button"
        className="ba-langmenu-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("common.language")}: ${current.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current.label}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="ba-langmenu-pop" role="menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              className={`ba-langmenu-item${l.code === locale ? " is-on" : ""}`}
              onClick={() => { setOpen(false); go(l.code); }}
            >
              <b>{l.label}</b>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default LanguageMenu;
