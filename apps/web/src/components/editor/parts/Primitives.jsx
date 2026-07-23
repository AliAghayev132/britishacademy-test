'use client';

/**
 * Editor toolbar-da istifadə olunan elementar (primitive) komponentlər.
 * Bunların hamısı module-level-də saxlanılır ki, render zamanı yenidən
 * yaradılmasın və focus oğurluğu (input remount) baş verməsin.
 */

import { useEffect, useRef, useState } from 'react';
import katex from 'katex';

/* ------------------------------------------------------------------ */
/*  ToolbarButton — yuvarlaqlaşdırılmış kvadrat düymə.                 */
/* ------------------------------------------------------------------ */
export function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className = '',
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // selection itməsin
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        relative inline-flex items-center justify-center
        w-8 h-8 rounded-md text-sm transition-all
        ${isActive
          ? 'bg-secondary text-white shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Divider — toolbar bölücüsü                                         */
/* ------------------------------------------------------------------ */
export function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

/* ------------------------------------------------------------------ */
/*  ImagePxInput — şəkil ölçüsü üçün rəqəmsal input.                   */
/*  Lokal state saxlayır, blur/Enter zamanı commit edir.               */
/*  Module-level olduğu üçün remount baş vermir.                       */
/* ------------------------------------------------------------------ */
export function ImagePxInput({ label, value, onCommit, min = 16, max = 4000 }) {
  const [v, setV] = useState(value ?? '');

  useEffect(() => {
    setV(value ?? '');
  }, [value]);

  const commit = () => {
    if (v === '' || v == null) {
      onCommit(null);
      return;
    }
    const n = Math.max(min, Math.min(max, parseInt(v, 10) || 0));
    onCommit(n);
  };

  return (
    <label className="flex items-center gap-1 text-xs text-gray-600">
      <span>{label}</span>
      <input
        type="number"
        value={v}
        min={min}
        max={max}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  MathPreview — KaTeX ilə canlı LaTeX önizləməsi                     */
/* ------------------------------------------------------------------ */
export function MathPreview({ latex, displayMode = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(latex || ' ', ref.current, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      ref.current.textContent = latex;
    }
  }, [latex, displayMode]);

  return (
    <div
      ref={ref}
      className="min-h-[2rem] px-3 py-2 bg-gray-50 border border-gray-200 rounded text-center overflow-x-auto"
    />
  );
}
