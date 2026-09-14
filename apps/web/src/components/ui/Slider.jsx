"use client";

// React
import { useRef } from "react";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * Sürüşdürmə (aralıq) — native `<input type="range">` əvəzi.
 *
 * Native sürüşdürmənin izi və düyməsi hər brauzerdə fərqlidir (Firefox-da
 * `accent-color` işləmir, Safari-də iz nazik boz xətdir). Bu komponent
 * `role="slider"` ilə əlçatandır: ←/→ addım, PageUp/PageDown 10 addım,
 * Home/End min/max; siçan və toxunuşla sürüşdürülür.
 *
 * `onChange({ target: { value } })` — native müqavilə saxlanılır.
 */
export function Slider({ value, min = 0, max = 100, step = 1, onChange, disabled = false, className = "", ariaLabel }) {
  const trackRef = useRef(null);
  const lo = Number(min);
  const hi = Number(max);
  const st = Number(step) || 1;
  const v = clamp(Number(value) || 0, lo, hi);
  const pct = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 0;

  // Addıma yuvarlaqla; onluq addımda (0.01) üzən nöqtə quyruğunu kəs.
  const decimals = (String(st).split(".")[1] || "").length;
  const emit = (n) => {
    const snapped = clamp(Math.round((n - lo) / st) * st + lo, lo, hi);
    const next = Number(snapped.toFixed(decimals));
    if (next !== v) onChange?.({ target: { value: next } });
  };

  const fromPointer = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    emit(lo + ((clientX - r.left) / r.width) * (hi - lo));
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    fromPointer(e.clientX);
  };
  const onPointerMove = (e) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    fromPointer(e.clientX);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const map = {
      ArrowRight: v + st, ArrowUp: v + st, ArrowLeft: v - st, ArrowDown: v - st,
      PageUp: v + st * 10, PageDown: v - st * 10, Home: lo, End: hi,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    emit(map[e.key]);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={lo}
      aria-valuemax={hi}
      aria-valuenow={v}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
      className={`group relative flex h-5 touch-none select-none items-center outline-none ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${className}`}
    >
      <span className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />
      <span className="absolute left-0 h-1.5 rounded-full bg-[#00157A]" style={{ width: `${pct}%` }} />
      <span
        className="absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-[#00157A] bg-white shadow transition-shadow group-focus-visible:ring-4 group-focus-visible:ring-blue-200"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
