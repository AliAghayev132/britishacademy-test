'use client';

/**
 * HeadingDropdown — paraqraf / H1..H4 seçimi.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Type } from 'lucide-react';
import { HEADING_OPTIONS } from './constants';

export default function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const current =
    HEADING_OPTIONS.find((h) => h.level > 0 && editor?.isActive('heading', { level: h.level })) ||
    HEADING_OPTIONS.find((h) => h.level === 0);

  const Icon = current?.icon || Type;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                   text-gray-700 hover:bg-gray-100 transition-colors min-w-[130px]"
      >
        <Icon size={16} />
        <span className="truncate">{current?.label || 'Normal'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl
                        border border-gray-200 py-1 z-50 min-w-[180px]">
          {HEADING_OPTIONS.map(({ level, label, icon: I, desc }) => (
            <button
              key={level}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (level === 0) editor.chain().focus().setParagraph().run();
                else editor.chain().focus().setHeading({ level }).run();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition ${
                (level === 0 && !editor.isActive('heading')) ||
                editor.isActive('heading', { level })
                  ? 'bg-secondary/5 text-secondary'
                  : 'text-gray-700'
              }`}
            >
              <I size={18} />
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
