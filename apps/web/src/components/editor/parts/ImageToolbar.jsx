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

import { useEffect, useMemo, useState } from 'react';
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  RotateCcw,
  CaptionsIcon,
} from 'lucide-react';
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
