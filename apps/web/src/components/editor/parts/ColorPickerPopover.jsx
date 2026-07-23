'use client';

/**
 * ColorPickerPopover — universal rəng seçimi paneli.
 *
 * Hər iki halda istifadə olunur:
 *  1) Mətn rəngi (variant="text") — `setColor` / `unsetColor` çağırır.
 *  2) Vurğu rəngi (variant="highlight") — `setHighlight` / `unsetHighlight` çağırır.
 *
 * Eyni komponentdir, lakin prop-larla davranışı dəyişir.
 */

import { useEffect, useRef, useState } from 'react';
import { Palette, Highlighter } from 'lucide-react';
import { ToolbarButton } from './Primitives';
import { TEXT_COLORS, HIGHLIGHT_COLORS } from './constants';

export default function ColorPickerPopover({ editor, variant = 'text' }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(variant === 'text' ? '#2C4B62' : '#FEF3C7');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const palette = variant === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const Icon = variant === 'text' ? Palette : Highlighter;
  const title = variant === 'text' ? 'Mətn rəngi' : 'Vurğu rəngi';

  const apply = (color) => {
    if (variant === 'text') {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setOpen(false);
  };

  const reset = () => {
    if (variant === 'text') editor.chain().focus().unsetColor().run();
    else editor.chain().focus().unsetHighlight().run();
    setOpen(false);
  };

  const isHexValid = /^#[0-9a-f]{6}$/i.test(hex);
  const isActive = variant === 'highlight' && editor?.isActive('highlight');

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton onClick={() => setOpen((p) => !p)} title={title} isActive={isActive}>
        <Icon size={16} />
      </ToolbarButton>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className={`absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border
                      border-gray-200 p-2 z-50 ${
                        variant === 'text' ? 'w-[280px]' : 'w-[260px]'
                      }`}
        >
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Hazır rənglər
          </p>
          <div
            className={`grid gap-1 mb-2 ${
              variant === 'text' ? 'grid-cols-8' : 'grid-cols-6'
            }`}
          >
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => apply(c)}
                className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-2">
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Custom rəng (kod)
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={isHexValid ? hex : '#000000'}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && isHexValid) apply(hex);
                }}
                placeholder="#RRGGBB"
                maxLength={7}
                className="flex-1 px-2 py-1 text-xs font-mono border border-gray-200 rounded-md
                           focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                type="button"
                disabled={!isHexValid}
                onClick={() => apply(hex)}
                className="px-2 py-1 text-xs bg-secondary text-white rounded-md
                           hover:bg-secondary/90 disabled:opacity-40"
              >
                Tətbiq
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={reset}
            className="w-full mt-1.5 py-1 text-xs text-gray-500 hover:bg-gray-50 rounded"
          >
            {variant === 'text' ? 'Rəngi sıfırla' : 'Vurğunu sil'}
          </button>
        </div>
      )}
    </div>
  );
}
