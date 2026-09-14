"use client";

// React
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

// Hooks
import { useAnchoredPosition, useDismiss } from "@/hooks";

// Lib
import { useMarkDirty } from "@/lib";

/** Saytın işlətdiyi rənglər — tez seçim üçün. */
const PRESETS = [
  "#00157A", "#2E6BE6", "#7C4DFF", "#C13DBF", "#E0533D", "#F59E0B",
  "#12915B", "#0EA5A4", "#14141C", "#63636F", "#E4E6EF", "#FFFFFF",
];

const HEX = /^#([0-9a-f]{6})$/i;
const clamp01 = (n) => Math.min(1, Math.max(0, n));

function hexToHsv(hex) {
  const m = HEX.exec(hex || "");
  if (!m) return { h: 0, s: 0, v: 0 };
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return `#${[f(5), f(3), f(1)].map((x) => x.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Siçan/toxunuşla sürüşdürülən sahə — koordinatı 0..1 aralığında verir. */
function DragArea({ onPick, className, style, children, label }) {
  const ref = useRef(null);
  const pick = (e) => {
    const r = ref.current.getBoundingClientRect();
    onPick(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height));
  };
  return (
    <div
      ref={ref}
      aria-label={label}
      className={`relative touch-none select-none ${className}`}
      style={style}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
      onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e); }}
    >
      {children}
    </div>
  );
}

/**
 * Rəng seçici — native `<input type="color">` əvəzi.
 *
 * Native seçici əməliyyat sisteminin pəncərəsini açır (Windows-da köhnə
 * «Rənglər» dialoqu), brend rənglərini təklif etmir və HEX yazmağa imkan
 * vermir. Burada: brend palitrası, doyma/parlaqlıq sahəsi, ton zolağı və
 * HEX sahəsi. `onChange({ target: { value } })` — native müqavilə.
 */
export function ColorInput({ value, onChange, disabled = false, className = "", ariaLabel = "Rəng seç" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const markDirty = useMarkDirty();

  const hex = HEX.test(value || "") ? value.toUpperCase() : "#000000";
  const hsv = hexToHsv(hex);

  useDismiss(open, () => setOpen(false), [btnRef, popRef]);
  const coords = useAnchoredPosition(open, btnRef, { panelHeight: 320, panelWidth: 240, gap: 6 });

  const emit = (next) => {
    if (next.toUpperCase() === hex) return;
    markDirty();
    onChange?.({ target: { value: next.toUpperCase() } });
  };

  const toggle = () => {
    if (disabled) return;
    if (open) return setOpen(false);
    setDraft(hex);
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-label={`${ariaLabel}: ${hex}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={`cursor-pointer rounded-lg border border-gray-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        <span className="block h-full min-h-[1.5rem] w-full rounded-md" style={{ background: hex }} />
      </button>

      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label={ariaLabel}
            style={{ position: "fixed", left: coords.left, top: coords.top, bottom: coords.bottom, zIndex: 130 }}
            className="w-60 space-y-3 rounded-xl border border-gray-100 bg-white p-3 shadow-2xl"
          >
            <DragArea
              label="Doyma və parlaqlıq"
              className="h-32 cursor-crosshair overflow-hidden rounded-lg"
              style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
              onPick={(x, y) => emit(hsvToHex({ h: hsv.h, s: x, v: 1 - y }))}
            >
              <span
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </DragArea>
            <DragArea
              label="Ton"
              className="h-3 cursor-pointer rounded-full"
              style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
              onPick={(x) => emit(hsvToHex({ h: Math.min(359.9, x * 360), s: hsv.s || 1, v: hsv.v || 1 }))}
            >
              <span
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
              />
            </DragArea>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={c === hex}
                  onClick={() => { emit(c); setDraft(c); }}
                  className={`h-7 rounded-md border ${c === hex ? "ring-2 ring-[#00157A] ring-offset-1" : "border-gray-200"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              HEX
              <input
                value={draft}
                onChange={(e) => {
                  const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                  setDraft(next);
                  if (HEX.test(next)) emit(next);
                }}
                maxLength={7}
                spellCheck={false}
                className="w-full rounded-md border border-gray-300 px-2 py-1 font-mono text-sm uppercase text-gray-900 outline-none focus:border-blue-500"
              />
            </label>
          </div>,
          document.body,
        )}
    </>
  );
}
