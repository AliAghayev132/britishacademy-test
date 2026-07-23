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
