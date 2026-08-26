# Panel komponentləri

Panelin ayrı-ayrı hissələri. `Primitives.jsx` bütün düymələrin ümumi
görünüşünü verir — dizaynı dəyişmək üçün əsasən ora toxunmaq kifayətdir.

## `components/editor/parts/Primitives.jsx`

<sup>93 sətir</sup>

```jsx
'use client';

/**
 * Editor toolbar-da istifadə olunan elementar (primitive) komponentlər.
 * Bunların hamısı module-level-də saxlanılır ki, render zamanı yenidən
 * yaradılmasın və focus oğurluğu (input remount) baş verməsin.
 */

import { useEffect, useState } from 'react';

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
```

## `components/editor/parts/HeadingDropdown.jsx`

<sup>80 sətir</sup>

```jsx
'use client';

/**
 * HeadingDropdown — paraqraf / H1..H4 seçimi.
 */

// React
import { useEffect, useRef, useState } from 'react';

// Icons
import { ChevronDown, Type } from 'lucide-react';

// Local
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
```

## `components/editor/parts/FontPicker.jsx`

<sup>206 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  FontPicker — toolbar-a font ailəsi və ölçü seçimi əlavə edir.
 *
 *  Qeyd: input dəyəri lokal state-də saxlanılır və yalnız `blur` /
 *  Enter zamanı editor-a commit olunur — beləliklə yazma zamanı
 *  fokus itmir (editor.chain().focus() hər keystroke-da fokusu geri alır).
 *
 *  Font ailəsi seçimi:
 *   - "Default (Mark Pro)" — sayıtın əsas şrifti (unsetFontFamily çağırır,
 *     beləcə kopyalayıb yapışdırılan mətnin Times/Calibri kimi yad font-u silinir).
 *   - Digər seçimlər — istifadəçi bu fontları açıq şəkildə tətbiq edə bilər.
 * ===================================================================== */

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FONT_SIZE_PRESETS = [
  '10', '11', '12', '13', '14', '15', '16',
  '18', '20', '24', '28', '32', '40', '48', '64',
];

/* Sayıtın əsas font-u Mark Pro-dur. Default seçimi etiketin
   sağında "(Mark Pro)" kimi göstərmək üçün burada saxlanılır. */
const DEFAULT_FONT_LABEL = 'Mark Pro';

const FONT_FAMILIES = [
  // value=null → unsetFontFamily (sayıtın əsas font-u)
  { label: 'Default', hint: DEFAULT_FONT_LABEL, value: null, css: '"Mark Pro", sans-serif' },
  { label: 'Mark Pro', value: '"Mark Pro", sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
];

/** "20px" → "20"; "1.5em" → "1.5em" (qoruyur) */
function toInputValue(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d+(?:\.\d+)?)(px)?$/);
  return m ? m[1] : String(v);
}

/** "20" → "20px"; "1.5em" → "1.5em" */
function normalizeSize(v) {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

/** Editor-dakı font-family dəyəri ilə FONT_FAMILIES siyahısından
 *  uyğun seçimi tapır (case-insensitive, dırnaqları nəzərə almır). */
function findFontMatch(currentFamily) {
  if (!currentFamily) return FONT_FAMILIES[0]; // Default
  const norm = (s) => String(s).toLowerCase().replace(/['"]+/g, '').trim();
  const cur = norm(currentFamily);
  return (
    FONT_FAMILIES.find((f) => f.value && norm(f.value) === cur) ||
    FONT_FAMILIES.find((f) => f.value && cur.startsWith(norm(f.value).split(',')[0])) ||
    null
  );
}

export default function FontPicker({ editor }) {
  const editorSize = editor?.getAttributes('textStyle')?.fontSize || '';
  const editorFamily = editor?.getAttributes('textStyle')?.fontFamily || '';
  const [sizeInput, setSizeInput] = useState(toInputValue(editorSize));
  const [familyOpen, setFamilyOpen] = useState(false);

  // Editor state-i kənardan dəyişəndə (məs. başqa paragraf seçildikdə) input-u yenilə
  useEffect(() => {
    setSizeInput(toInputValue(editorSize));
  }, [editorSize]);

  // Click-outside ilə font dropdown-u bağla
  useEffect(() => {
    if (!familyOpen) return;
    const onDoc = (e) => {
      if (!e.target.closest?.('[data-font-family-popover]')) setFamilyOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [familyOpen]);

  if (!editor) return null;

  const commitSize = () => {
    const normalized = normalizeSize(sizeInput);
    if (!normalized) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(normalized).run();
    }
  };

  const applyFamily = (font) => {
    if (!font || font.value == null) {
      // Default — yad fontu sıfırla
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font.value).run();
    }
    setFamilyOpen(false);
  };

  const matched = findFontMatch(editorFamily);
  const currentLabel = matched
    ? matched.label === 'Default'
      ? `Default (${DEFAULT_FONT_LABEL})`
      : matched.label
    : (editorFamily.split(',')[0].replace(/['"]/g, '').trim() || `Default (${DEFAULT_FONT_LABEL})`);

  return (
    <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
      {/* Font ailəsi seçimi */}
      <div className="relative" data-font-family-popover>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setFamilyOpen((p) => !p)}
          title="Şrift ailəsi"
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs hover:bg-gray-100 transition min-w-[140px]"
        >
          <span
            className="text-xs font-medium text-gray-700 truncate flex-1 text-left"
            style={matched?.css ? { fontFamily: matched.css } : undefined}
          >
            {currentLabel}
          </span>
          <ChevronDown size={12} className="text-gray-400 shrink-0" />
        </button>

        {familyOpen && (
          <div
            className="absolute top-full left-0 mt-1 z-50 w-[200px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden py-1"
          >
            {FONT_FAMILIES.map((f, i) => {
              const isCurrent = matched?.label === f.label;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFamily(f)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition ${
                    isCurrent ? 'bg-secondary/10 text-secondary font-medium' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: f.css || f.value || undefined }}
                >
                  <span className="truncate">{f.label}</span>
                  {f.hint && (
                    <span className="text-[10px] text-gray-400 font-normal shrink-0">
                      {f.hint}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="border-t border-gray-100 mt-1 pt-1 px-3 py-1.5 text-[10px] text-gray-400 leading-snug">
              <b>Default</b> — kopyalayıb yapışdırılan yad fontu silir,
              saytın əsas şriftinə qaytarır.
            </div>
          </div>
        )}
      </div>

      {/* Font ölçüsü — yalnız blur/Enter zamanı commit (fokus itməsin) */}
      <label
        className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs"
        title="Şrift ölçüsü (Enter ilə tətbiq et)"
      >
        <span className="text-[10px] font-bold text-gray-400 uppercase">Px</span>
        <input
          type="text"
          list="bdu-font-sizes"
          value={sizeInput}
          onChange={(e) => setSizeInput(e.target.value)}
          onBlur={commitSize}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitSize();
            } else if (e.key === 'Escape') {
              setSizeInput(toInputValue(editorSize));
              e.currentTarget.blur();
            }
          }}
          placeholder="auto"
          className="bg-transparent text-xs font-medium outline-none w-[50px]"
        />
        <datalist id="bdu-font-sizes">
          {FONT_SIZE_PRESETS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
    </div>
  );
}
```

## `components/editor/parts/ColorPickerPopover.jsx`

<sup>140 sətir</sup>

```jsx
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

// React
import { useEffect, useRef, useState } from 'react';

// Icons
import { Palette, Highlighter } from 'lucide-react';

// Local
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
```

## `components/editor/parts/LinkInput.jsx`

<sup>88 sətir</sup>

```jsx
'use client';

/**
 * LinkInput — link əlavə etmə inline forması və link silmə düyməsi.
 */

// React
import { useState } from 'react';

// Icons
import { Link as LinkIcon, Unlink, Check } from 'lucide-react';

// Local
import { ToolbarButton } from './Primitives';

export default function LinkInput({ editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  const apply = () => {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    editor.chain().focus().setLink({ href }).run();
    setUrl('');
    setOpen(false);
  };

  const remove = () => editor.chain().focus().unsetLink().run();

  if (open) {
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') apply();
            if (e.key === 'Escape') {
              setOpen(false);
              setUrl('');
            }
          }}
          placeholder="URL daxil edin..."
          autoFocus
          className="w-40 px-2 py-1 text-sm bg-transparent border-none focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={apply}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen(false);
            setUrl('');
          }}
          className="p-1 text-red-500 hover:bg-red-50 rounded"
        >
          <Unlink size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <ToolbarButton
        onClick={() => setOpen(true)}
        isActive={editor.isActive('link')}
        title="Link əlavə et"
      >
        <LinkIcon size={16} />
      </ToolbarButton>
      {editor.isActive('link') && (
        <ToolbarButton onClick={remove} title="Linki sil">
          <Unlink size={16} />
        </ToolbarButton>
      )}
    </>
  );
}
```

## `components/editor/parts/ImageToolbar.jsx`

<sup>229 sətir</sup>

```jsx
'use client';

/**
 * ImageToolbar — yalnız şəkil seçildikdə görünən alət sırası.
 *
 * - Float: sol / mərkəz / sağ
 * - Sürətli ölçü düymələri (25/50/75/100 %)
 * - W (en) və H (hündürlük) px input
 * - Object-fit (cover/contain/fill/none/scale-down)
 * - Reset (bütün ölçü/style sıfırla)
 */

// React
import { useEffect, useMemo, useState } from 'react';

// Icons
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  RotateCcw,
  CaptionsIcon,
} from 'lucide-react';

// Local
import { ToolbarButton, Divider, ImagePxInput } from './Primitives';
import {
  getCurrentImageStyle,
  updateImageStyle,
  updateImageAttrs,
  getCurrentImageAttr,
} from './utils';

export default function ImageToolbar({ editor }) {
  const style = useMemo(() => getCurrentImageStyle(editor), [editor, editor?.state]);
  const caption = useMemo(() => getCurrentImageAttr(editor, 'caption'), [editor, editor?.state]);

  /* Caption input üçün lokal state — hara yazılan hesab fokusu oğurlamır.
     Yalnız blur / Enter zamanı editor-a yığılır. */
  const [captionInput, setCaptionInput] = useState(caption || '');
  useEffect(() => {
    setCaptionInput(caption || '');
  }, [caption]);

  const commitCaption = () => {
    const next = captionInput.trim();
    if ((next || '') === (caption || '')) return;
    updateImageAttrs(editor, { caption: next || null });
  };

  const widthPx = parseSizePx(style.width);
  const heightPx = parseSizePx(style.height);
  const fit = style['object-fit'] || '';

  /* ---- Float yerləşdirmə (sol / mərkəz / sağ) ---- */
  const setFloat = (position) => {
    if (position === 'left') {
      updateImageStyle(editor, {
        float: 'left',
        'margin-right': '16px',
        'margin-bottom': '8px',
        'margin-left': null,
        display: null,
        'max-width': '50%',
      });
    } else if (position === 'right') {
      updateImageStyle(editor, {
        float: 'right',
        'margin-left': '16px',
        'margin-bottom': '8px',
        'margin-right': null,
        display: null,
        'max-width': '50%',
      });
    } else {
      updateImageStyle(editor, {
        float: null,
        display: 'block',
        'margin-left': 'auto',
        'margin-right': 'auto',
        'max-width': '100%',
      });
    }
  };

  /* ---- Sürətli faiz ölçüsü ---- */
  const setPercent = (pct) => {
    updateImageStyle(editor, {
      width: `${pct}%`,
      'max-width': `${pct}%`,
      height: null,
    });
  };

  return (
    <>
      <Divider />
      <div className="flex items-center gap-0.5 flex-wrap">
        <ToolbarButton onClick={() => setFloat('left')} title="Sola yerləşdir">
          <AlignStartVertical size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => setFloat('center')} title="Mərkəzə yerləşdir">
          <AlignCenterVertical size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => setFloat('right')} title="Sağa yerləşdir">
          <AlignEndVertical size={16} />
        </ToolbarButton>

        <Divider />

        {[25, 50, 75, 100].map((p) => (
          <ToolbarButton
            key={p}
            onClick={() => setPercent(p)}
            title={`${p}% ölçü`}
            className="!text-xs !px-1.5 !w-auto"
          >
            {p}%
          </ToolbarButton>
        ))}

        <Divider />

        <ImagePxInput
          label="W"
          value={widthPx}
          min={20}
          max={2000}
          onCommit={(n) =>
            updateImageStyle(
              editor,
              n == null
                ? { width: null, 'max-width': null }
                : { width: `${n}px`, 'max-width': `${n}px` }
            )
          }
        />
        <ImagePxInput
          label="H"
          value={heightPx}
          min={20}
          max={4000}
          onCommit={(n) =>
            updateImageStyle(editor, n == null ? { height: null } : { height: `${n}px` })
          }
        />

        <label
          className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs"
          title="Object-fit"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase">Fit</span>
          <select
            value={fit}
            onChange={(e) =>
              updateImageStyle(editor, { 'object-fit': e.target.value || null })
            }
            className="bg-transparent text-xs font-medium outline-none cursor-pointer"
          >
            <option value="">Auto</option>
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
            <option value="scale-down">Scale-down</option>
          </select>
        </label>

        <ToolbarButton
          onClick={() =>
            updateImageStyle(editor, {
              width: null,
              height: null,
              'max-width': null,
              'object-fit': null,
              float: null,
              display: null,
              'margin-left': null,
              'margin-right': null,
              'margin-bottom': null,
            })
          }
          title="Şəkil ölçülərini sıfırla"
          className="!text-xs"
        >
          <RotateCcw size={14} />
        </ToolbarButton>

        <Divider />

        {/* Altyazı (caption) */}
        <label
          className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs"
          title="Şəkilə altyazı əlavə et"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <CaptionsIcon size={13} className="text-gray-400" />
          <input
            type="text"
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            onBlur={commitCaption}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitCaption();
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setCaptionInput(caption || '');
                e.currentTarget.blur();
              }
            }}
            placeholder="Altyazı..."
            className="bg-transparent text-xs outline-none w-[160px]"
          />
        </label>
      </div>
    </>
  );
}

/** "240px" → "240" (yoxsa boş sətir) */
function parseSizePx(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d+)px$/);
  return m ? m[1] : '';
}
```
