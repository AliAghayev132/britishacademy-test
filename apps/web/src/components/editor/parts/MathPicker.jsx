'use client';

/**
 * MathPicker — Word-vari geniş düstur seçimi paneli.
 *
 * Xüsusiyyətləri:
 *  - Inline / Block toggle.
 *  - Kateqoriyalı simvollar (yunan, operatorlar, hesab, çoxluqlar, oxlar, matrislər...).
 *  - Açar söz axtarışı (azərbaycanca + latex).
 *  - Tıklayanda LaTeX redaktorun aktiv kursoruna daxil edilir
 *    (sonuna əlavə yox).
 *  - Canlı KaTeX önizləməsi.
 *  - Ctrl/Cmd + Enter ilə əlavə et.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sigma, Search, X, ChevronRight } from 'lucide-react';
import { ToolbarButton, MathPreview } from './Primitives';
import { MATH_CATEGORIES, ALL_MATH_ITEMS } from './constants';

export default function MathPicker({ editor }) {
  // Popover açıq/qapalı vəziyyəti
  const [open, setOpen] = useState(false);

  // Display rejimi: blok (mərkəzlənmiş, böyük) və ya inline (mətn içi)
  const [mode, setMode] = useState('inline');

  // İstifadəçinin daxil etdiyi LaTeX
  const [latex, setLatex] = useState('');

  // Aktiv kateqoriya tab-ı
  const [activeCat, setActiveCat] = useState(MATH_CATEGORIES[0].id);

  // Axtarış sorğusu
  const [query, setQuery] = useState('');

  const popoverRef = useRef(null);
  const textareaRef = useRef(null);

  /* ---------- Click-outside ilə bağlanma ---------- */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  /* ---------- Aktiv kateqoriya elementləri / axtarış nəticəsi ---------- */
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return ALL_MATH_ITEMS.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.latex.toLowerCase().includes(q) ||
          (it.keywords || '').toLowerCase().includes(q)
      ).slice(0, 200);
    }
    const cat = MATH_CATEGORIES.find((c) => c.id === activeCat);
    return cat ? cat.items : [];
  }, [query, activeCat]);

  /* ---------- Kursora simvol daxil etmə ---------- */
  const insertAtCursor = (snippet) => {
    const ta = textareaRef.current;
    if (!ta) {
      setLatex((prev) => prev + snippet);
      return;
    }
    const start = ta.selectionStart ?? latex.length;
    const end = ta.selectionEnd ?? latex.length;
    const next = latex.slice(0, start) + snippet + latex.slice(end);
    setLatex(next);
    // Kursoru daxil edilmiş hissənin sonuna qoy
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = start + snippet.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
    });
  };

  /* ---------- Tətbiq et ---------- */
  const apply = () => {
    const value = latex.trim();
    if (!value || !editor) return;
    if (mode === 'block') {
      editor.commands.insertMathBlock({ latex: value });
    } else {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'mathInline', attrs: { latex: value } })
        .run();
    }
    setLatex('');
    setOpen(false);
  };

  /* ---------- Toggle ---------- */
  const toggle = () => {
    setOpen((p) => !p);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <ToolbarButton
        onClick={toggle}
        isActive={open}
        title="Riyazi düstur (KaTeX)"
      >
        <Sigma size={16} />
      </ToolbarButton>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-[640px] max-w-[92vw]
                     bg-white border border-gray-200 rounded-xl shadow-2xl
                     flex flex-col overflow-hidden"
          // Editor focus-unu itirməsin deyə mousedown-u bloklayırıq
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* === Başlıq: rejim seçimi və axtarış === */}
          <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('inline')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  mode === 'inline'
                    ? 'bg-secondary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Sətir içi
              </button>
              <button
                type="button"
                onClick={() => setMode('block')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  mode === 'block'
                    ? 'bg-secondary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Blok
              </button>
            </div>

            <div className="flex-1 relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Simvol axtar (məs. integral, alpha, ≤ ...)"
                className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-md
                           focus:outline-none focus:border-secondary bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Bağla"
            >
              <X size={16} />
            </button>
          </div>

          {/* === Əsas məzmun: kateqoriyalar + simvollar === */}
          <div className="flex max-h-[340px]">
            {/* Sol panel — kateqoriyalar */}
            {!query && (
              <div className="w-40 border-r border-gray-100 overflow-y-auto bg-gray-50/30">
                {MATH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCat(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left
                               border-l-2 transition ${
                                 activeCat === cat.id
                                   ? 'border-secondary bg-white text-secondary font-medium'
                                   : 'border-transparent text-gray-600 hover:bg-white'
                               }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={12} className="opacity-40" />
                  </button>
                ))}
              </div>
            )}

            {/* Sağ panel — simvol qrid */}
            <div className="flex-1 p-3 overflow-y-auto">
              {visibleItems.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-6">
                  Heç nə tapılmadı
                </div>
              )}
              <div className="grid grid-cols-6 gap-1.5">
                {visibleItems.map((item, idx) => (
                  <button
                    key={`${item.label}-${idx}`}
                    type="button"
                    onClick={() => insertAtCursor(item.latex)}
                    title={`${item.label}  →  ${item.latex}`}
                    className="px-1.5 py-2 text-xs border border-gray-200 rounded
                               bg-white hover:bg-secondary/10 hover:border-secondary
                               transition text-gray-700 truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* === LaTeX redaktoru və önizləmə === */}
          <div className="p-3 border-t border-gray-100 space-y-2">
            <textarea
              ref={textareaRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  apply();
                }
              }}
              placeholder="LaTeX kodu... məs. \frac{a}{b}"
              rows={2}
              className="w-full px-2 py-1.5 text-sm font-mono border border-gray-200
                         rounded focus:outline-none focus:border-secondary resize-none"
            />

            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                Önizləmə
              </div>
              <MathPreview latex={latex || 'x'} displayMode={mode === 'block'} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>
                İpucu: <kbd className="px-1 bg-gray-100 rounded">Ctrl + Enter</kbd> ilə əlavə et
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLatex('');
                    setOpen(false);
                  }}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Ləğv et
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={!latex.trim()}
                  className="px-3 py-1 text-xs bg-secondary text-white rounded
                             hover:bg-secondary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Əlavə et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
