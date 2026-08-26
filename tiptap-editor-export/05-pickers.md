# Kollaj və slayder seçiciləri

Ən böyük hissə. Kollaj seçicisi hər slot üçün ayrıca kəsmə (crop) dialoqu
açır; slayder seçicisi çoxlu şəkli sıralayır. `react-easy-crop` yalnız
burada işlədilir — kollaj lazım deyilsə bu üç faylı və həmin paketi
buraxmaq olar.

## `components/editor/parts/CollagePicker.jsx`

<sup>919 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  CollagePicker — toolbar düyməsi: 2/3/4 şəkildən kollaj yaratmaq
 *  və mövcud kollajı redaktə etmək.
 *
 *  Funksiyalar:
 *    - Layout seçimi (2 / 3-row / 3-mosaic / 4-grid / 4-mosaic)
 *    - Hər slot üçün şəkil yüklə → CROP dialoqu → upload
 *    - Boşluq (gap) və aspect ratio tənzimləmələri
 *    - Mövcud kollaj seçildikdə avtomatik EDIT rejimi:
 *        - mövcud şəkillər və ayarlar yüklənir
 *        - "Yenilə" düyməsi mövcud node-u updateAttributes ilə yeniləyir
 *
 *  Crop: react-easy-crop (CollageCropDialog) — slot-a uyğun aspect-də.
 * ===================================================================== */

// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Icons
import {
  LayoutGrid, X, Plus, Loader2, Trash2, Check, Pencil,
  AlignLeft, AlignCenter, AlignRight, Settings2, Crosshair,
} from 'lucide-react';

// Local
import { ToolbarButton } from './Primitives';
import { COLLAGE_LAYOUTS } from './ImageCollageExtension';
import CollageCropDialog from './CollageCropDialog';

const ASPECTS = [
  { value: '4/3',  label: '4 : 3' },
  { value: '16/9', label: '16 : 9' },
  { value: '1/1',  label: '1 : 1 (kvadrat)' },
  { value: '3/4',  label: '3 : 4 (vertikal)' },
  { value: 'auto', label: 'Auto (sərbəst)' },
];

const WIDTH_PRESETS = [
  { value: '25%',  label: '25%' },
  { value: '50%',  label: '50%' },
  { value: '75%',  label: '75%' },
  { value: '100%', label: '100%' },
  { value: 'custom', label: 'Custom…' },
];

/* Layout üçün kiçik vizual preview ikonu */
function LayoutIcon({ layout }) {
  const cells = (() => {
    switch (layout) {
      case '2':         return [{ s: 'col-span-1' }, { s: 'col-span-1' }];
      case '3-row':     return [{ s: 'col-span-1' }, { s: 'col-span-1' }, { s: 'col-span-1' }];
      case '3-mosaic':  return [
        { s: 'row-span-2 col-span-1' },
        { s: 'col-span-1' },
        { s: 'col-span-1' },
      ];
      case '4-row':     return [{}, {}, {}, {}];
      case '4-grid':    return [{}, {}, {}, {}];
      case '4-mosaic':  return [
        { s: 'row-span-3 col-span-1' },
        { s: 'col-span-1' },
        { s: 'col-span-1' },
        { s: 'col-span-1' },
      ];
      default: return [];
    }
  })();

  const cols = layout === '3-row' ? 'grid-cols-3'
    : layout === '4-row' ? 'grid-cols-4'
    : layout === '4-grid' ? 'grid-cols-2'
    : 'grid-cols-2';
  const rows = layout === '4-mosaic' ? 'grid-rows-3'
    : layout === '3-mosaic' ? 'grid-rows-2'
    : layout === '4-grid' ? 'grid-rows-2'
    : 'grid-rows-1';

  return (
    <div className={`grid gap-0.5 w-9 h-9 ${cols} ${rows}`}>
      {cells.map((c, i) => (
        <div key={i} className={`bg-gray-300 rounded-sm ${c.s || ''}`} />
      ))}
    </div>
  );
}

export default function CollagePicker({ editor, onImageUpload }) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState('2');
  const [gap, setGap] = useState(8);
  const [aspect, setAspect] = useState('4/3');
  const [width, setWidth] = useState('100%');           // '100%' | '75%' | px str
  const [heightMode, setHeightMode] = useState('auto'); // 'auto' | 'fixed'
  const [heightPx, setHeightPx] = useState(420);
  const [align, setAlign] = useState('center');         // left | center | right
  const [radius, setRadius] = useState(8);
  const [images, setImages] = useState([]);          // [{ src, alt, fit, scale, posX, posY } | null]
  const [activeSlot, setActiveSlot] = useState(null);  // seçili slot — per-image tənzimləmə üçün
  const [loadingIdx, setLoadingIdx] = useState(-1);

  /* Crop state */
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  /* Edit mode — seçili `imageCollage` node-u izləyirik */
  const [editingPos, setEditingPos] = useState(null);

  const fileInputRef = useRef(null);
  const targetSlotRef = useRef(0);

  const slotCount = COLLAGE_LAYOUTS[layout]?.count || 2;

  /* Layout dəyişəndə şəkil massivinin uzunluğunu uyğunlaşdır */
  useEffect(() => {
    setImages((prev) => {
      const next = prev.slice(0, slotCount);
      while (next.length < slotCount) next.push(null);
      return next;
    });
  }, [slotCount]);

  /* Editor selection-u dinlə → seçili `imageCollage`-ı tap */
  useEffect(() => {
    if (!editor) return;
    const onSelect = () => {
      const { state } = editor;
      const { from } = state.selection;
      const node = state.doc.nodeAt(from);
      if (node && node.type.name === 'imageCollage') {
        setEditingPos(from);
      } else {
        setEditingPos(null);
      }
    };
    editor.on('selectionUpdate', onSelect);
    onSelect();
    return () => {
      editor.off('selectionUpdate', onSelect);
    };
  }, [editor]);

  /* Modal portal mount + body scroll lock */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && !cropOpen) setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, cropOpen]);

  /* Reset → boş halqa */
  const reset = useCallback(() => {
    setImages(Array(slotCount).fill(null));
    setLoadingIdx(-1);
    setActiveSlot(null);
  }, [slotCount]);

  /* Slot atributunu yeniləmək üçün köməkçi */
  const updateSlot = useCallback((idx, patch) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  /* === EDIT rejimi: seçili kollajın atributlarını state-ə yüklə === */
  const loadFromSelectedCollage = useCallback(() => {
    if (!editor || editingPos == null) return false;
    const node = editor.state.doc.nodeAt(editingPos);
    if (!node || node.type.name !== 'imageCollage') return false;
    const attrs = node.attrs || {};
    setLayout(attrs.layout || '2');
    setGap(attrs.gap ?? 8);
    setAspect(attrs.aspect || '4/3');
    setWidth(attrs.width || '100%');
    if (attrs.height && attrs.height !== 'auto') {
      setHeightMode('fixed');
      const m = String(attrs.height).match(/(\d+)/);
      setHeightPx(m ? parseInt(m[1], 10) : 420);
    } else {
      setHeightMode('auto');
    }
    setAlign(attrs.align || 'center');
    setRadius(attrs.radius ?? 8);
    const imgs = Array.isArray(attrs.images) ? [...attrs.images] : [];
    const def = COLLAGE_LAYOUTS[attrs.layout || '2'];
    const max = def?.count || 2;
    while (imgs.length < max) imgs.push(null);
    setImages(imgs.slice(0, max));
    return true;
  }, [editor, editingPos]);

  /* Toolbar düyməsi klikləndikdə */
  const togglePopover = () => {
    if (!open) {
      // Açırıq → əgər kollaj seçilibsə, dəyərləri yüklə; yoxsa təmizlə
      const loaded = loadFromSelectedCollage();
      if (!loaded) reset();
    }
    setOpen((v) => !v);
  };

  /* === Şəkil seçimi → CROP dialoqu === */
  const openFilePicker = (slotIdx) => {
    targetSlotRef.current = slotIdx;
    fileInputRef.current?.click();
  };

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
    setCropOpen(true);
  }, []);

  /* Crop təsdiq → upload → slot-a yaz */
  const handleCropConfirm = useCallback(async (blob) => {
    setCropOpen(false);
    if (!blob || !onImageUpload) {
      setPendingFile(null);
      return;
    }
    const idx = targetSlotRef.current;
    setLoadingIdx(idx);
    try {
      const baseName =
        (pendingFile?.name?.replace(/\.[^.]+$/, '') || 'collage');
      const file = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
      const url = await onImageUpload(file);
      if (url) {
        setImages((prev) => {
          const next = [...prev];
          next[idx] = {
            src: url,
            alt: baseName,
            fit: 'cover',
            scale: 1,
            posX: 50,
            posY: 50,
            width: '',
            height: '',
            caption: '',
          };
          return next;
        });
      }
    } catch (err) {
      console.error('Collage upload failed:', err);
    } finally {
      setLoadingIdx(-1);
      setPendingFile(null);
    }
  }, [onImageUpload, pendingFile]);

  const handleCropCancel = useCallback(() => {
    setCropOpen(false);
    setPendingFile(null);
  }, []);

  /* === Daxil et / Yenilə === */
  const isEditing = editingPos != null;

  const insertOrUpdate = useCallback(() => {
    const filled = images.filter((i) => i && i.src);
    if (filled.length < 2 || !editor) return;
    const heightVal = heightMode === 'fixed' ? `${heightPx}px` : 'auto';
    const widthVal = width || '100%';
    const attrsToWrite = {
      layout,
      gap,
      aspect,
      width: widthVal,
      height: heightVal,
      align,
      radius,
      images: filled.map((i) => ({
        src: i.src,
        alt: i.alt || '',
        fit: i.fit || 'cover',
        scale: Number(i.scale) || 1,
        posX: Number.isFinite(i.posX) ? i.posX : 50,
        posY: Number.isFinite(i.posY) ? i.posY : 50,
        width: (i.width || '').toString(),
        height: (i.height || '').toString(),
        caption: (i.caption || '').toString(),
      })),
    };

    if (isEditing) {
      // Mövcud node-u əvəz et
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          const node = editor.state.doc.nodeAt(editingPos);
          if (!node || node.type.name !== 'imageCollage') return false;
          tr.setNodeMarkup(editingPos, undefined, attrsToWrite);
          return true;
        })
        .run();
    } else {
      editor
        .chain()
        .insertImageCollage(attrsToWrite)
        .run();
    }
    setOpen(false);
    reset();
  }, [editor, editingPos, isEditing, layout, images, gap, aspect, width, heightMode, heightPx, align, radius, reset]);

  /* Seçili kollajı sil */
  const deleteCollage = useCallback(() => {
    if (!editor || editingPos == null) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const node = editor.state.doc.nodeAt(editingPos);
        if (!node || node.type.name !== 'imageCollage') return false;
        tr.delete(editingPos, editingPos + node.nodeSize);
        return true;
      })
      .run();
    setOpen(false);
    reset();
  }, [editor, editingPos, reset]);

  const filledCount = useMemo(() => images.filter((i) => i?.src).length, [images]);

  /* Slot grid sinifi (preview üçün eyni qaydalar) */
  const previewGridClass = (() => {
    switch (layout) {
      case '2':         return 'grid-cols-2 grid-rows-1';
      case '3-row':     return 'grid-cols-3 grid-rows-1';
      case '3-mosaic':  return 'grid-cols-2 grid-rows-2';
      case '4-row':     return 'grid-cols-4 grid-rows-1';
      case '4-grid':    return 'grid-cols-2 grid-rows-2';
      case '4-mosaic':  return 'grid-cols-2 grid-rows-3';
      default:          return 'grid-cols-2';
    }
  })();
  const slotClass = (i) => {
    if (layout === '3-mosaic' && i === 0) return 'row-span-2';
    if (layout === '4-mosaic' && i === 0) return 'row-span-3';
    return '';
  };

  return (
    <>
      <span className="inline-flex">
        <ToolbarButton
          onClick={togglePopover}
          isActive={open || isEditing}
          title={
            isEditing
              ? 'Seçili kollajı redaktə et'
              : 'Şəkil kollajı (2/3/4 şəkil)'
          }
        >
          {isEditing ? <Pencil size={16} /> : <LayoutGrid size={16} />}
        </ToolbarButton>
      </span>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[2147482900] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !cropOpen) setOpen(false);
          }}
        >
        <div
          className="relative w-[min(98vw,1180px)] max-h-[94vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Başlıq */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              {isEditing ? 'Kollajı redaktə et' : 'Şəkil kollajı'}
            </h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-500"
            >
              <X size={14} />
            </button>
          </div>

          {/* Layout seçimi */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(COLLAGE_LAYOUTS).map(([key, def]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayout(key)}
                title={def.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition-all
                  ${layout === key
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
              >
                <LayoutIcon layout={key} />
                <span className="font-medium">{def.count} şəkil</span>
              </button>
            ))}
          </div>

          {/* Slot preview (canlı) */}
          <div
            className={`mx-auto mb-3 transition-all`}
            style={{
              width,
              marginLeft: align === 'left' ? '0' : align === 'right' ? 'auto' : 'auto',
              marginRight: align === 'right' ? '0' : align === 'left' ? 'auto' : 'auto',
            }}
          >
            <div
              className={`grid ${previewGridClass} rounded-lg overflow-hidden bg-gray-100 border border-gray-200`}
              style={{
                gap: `${gap}px`,
                padding: `${gap}px`,
                aspectRatio:
                  heightMode === 'fixed' || aspect === 'auto'
                    ? 'auto'
                    : aspect.replace('/', ' / '),
                height: heightMode === 'fixed' ? `${heightPx}px` : undefined,
              }}
            >
            {Array.from({ length: slotCount }).map((_, i) => {
              const img = images[i];
              const isLoading = loadingIdx === i;
              return (
                <div
                  key={i}
                  className={`relative bg-white overflow-hidden border border-dashed border-gray-300 group ${slotClass(i)}`}
                  style={{ borderRadius: `${radius}px` }}
                >
                  {img?.src ? (
                    <>
                      <img
                        src={img.src}
                        alt={img.alt}
                        className={img.width || img.height ? '' : 'w-full h-full'}
                        draggable={false}
                        style={{
                          objectFit: img.fit || 'cover',
                          objectPosition: `${img.posX ?? 50}% ${img.posY ?? 50}%`,
                          transform: (img.scale && img.scale !== 1) ? `scale(${img.scale})` : undefined,
                          transformOrigin: `${img.posX ?? 50}% ${img.posY ?? 50}%`,
                          transition: 'transform 0.15s ease',
                          width: img.width || (img.width === '' ? undefined : '100%'),
                          height: img.height || (img.height === '' ? undefined : '100%'),
                          maxWidth: '100%',
                          maxHeight: '100%',
                        }}
                      />
                      {activeSlot === i && (
                        <span className="pointer-events-none absolute inset-0 ring-2 ring-secondary ring-offset-1 rounded" />
                      )}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Ölcü / yerləşmə tənzimlə"
                          onClick={() => setActiveSlot(activeSlot === i ? null : i)}
                          className={`p-1.5 rounded ${activeSlot === i ? 'bg-secondary text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                        >
                          <Settings2 size={14} />
                        </button>
                        <button
                          type="button"
                          title="Dəyiş (yenidən kəs)"
                          onClick={() => openFilePicker(i)}
                          className="p-1.5 rounded bg-white text-gray-800 hover:bg-gray-100"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          title="Sil"
                          onClick={() => {
                            setImages((prev) => {
                              const next = [...prev];
                              next[i] = null;
                              return next;
                            });
                            if (activeSlot === i) setActiveSlot(null);
                          }}
                          className="p-1.5 rounded bg-white text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openFilePicker(i)}
                      disabled={isLoading}
                      className="absolute inset-0 flex flex-col items-center justify-center text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-secondary" />
                      ) : (
                        <>
                          <Plus size={18} />
                          <span className="mt-0.5">Şəkil əlavə et</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* === Per-image (seçili slot) tənzimləmələri === */}
          {activeSlot != null && images[activeSlot]?.src && (
            <div className="rounded-lg border border-secondary/40 p-2.5 mb-3 bg-secondary/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  Şəkil #{activeSlot + 1} — yerləşmə və ölçü
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlot(null)}
                  className="p-0.5 rounded hover:bg-white text-gray-500"
                  title="Bağla"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Sıra 1: Fit + Scale */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">Doldurma rejimi</span>
                  <select
                    value={images[activeSlot].fit || 'cover'}
                    onChange={(e) => updateSlot(activeSlot, { fit: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                  >
                    <option value="cover">Cover (kəs, doldur)</option>
                    <option value="contain">Contain (tam göstər)</option>
                    <option value="fill">Fill (uzat)</option>
                    <option value="none">None (orijinal)</option>
                  </select>
                </label>
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">
                    Yaxınlaşdırma: {(images[activeSlot].scale || 1).toFixed(2)}×
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={images[activeSlot].scale || 1}
                    onChange={(e) =>
                      updateSlot(activeSlot, { scale: parseFloat(e.target.value) })
                    }
                    className="w-full"
                  />
                </label>
              </div>

              {/* Sıra 2: Pos X + Pos Y */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">
                    Üfüqi mövqe: {images[activeSlot].posX ?? 50}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={images[activeSlot].posX ?? 50}
                    onChange={(e) =>
                      updateSlot(activeSlot, { posX: parseInt(e.target.value, 10) })
                    }
                    className="w-full"
                  />
                </label>
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">
                    Şaquli mövqe: {images[activeSlot].posY ?? 50}%
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={images[activeSlot].posY ?? 50}
                    onChange={(e) =>
                      updateSlot(activeSlot, { posY: parseInt(e.target.value, 10) })
                    }
                    className="w-full"
                  />
                </label>
              </div>

              {/* Altyazı (caption) */}
              <label className="block text-xs text-gray-700 mb-2">
                <span className="font-medium">Altyazı (caption)</span>
                <input
                  type="text"
                  value={images[activeSlot].caption || ''}
                  onChange={(e) => updateSlot(activeSlot, { caption: e.target.value })}
                  placeholder="Bu şəklin altında görünəcək yazı..."
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                />
              </label>

              {/* Sıra 3: Şəkil ölçüsü (width/height) — sərbəst */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">Şəkil eni</span>
                  <input
                    type="text"
                    value={images[activeSlot].width || ''}
                    onChange={(e) => updateSlot(activeSlot, { width: e.target.value })}
                    placeholder="auto / 100% / 300px"
                    className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['', '50%', '75%', '100%', '200px'].map((p) => (
                      <button
                        key={p || 'auto'}
                        type="button"
                        onClick={() => updateSlot(activeSlot, { width: p })}
                        className={`px-1.5 py-0.5 text-[10px] rounded border ${
                          (images[activeSlot].width || '') === p
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p || 'auto'}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="flex flex-col text-xs text-gray-700 gap-1">
                  <span className="font-medium">Şəkil hündürlüyü</span>
                  <input
                    type="text"
                    value={images[activeSlot].height || ''}
                    onChange={(e) => updateSlot(activeSlot, { height: e.target.value })}
                    placeholder="auto / 100% / 250px"
                    className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['', '50%', '100%', '200px', '300px'].map((p) => (
                      <button
                        key={p || 'auto'}
                        type="button"
                        onClick={() => updateSlot(activeSlot, { height: p })}
                        className={`px-1.5 py-0.5 text-[10px] rounded border ${
                          (images[activeSlot].height || '') === p
                            ? 'bg-secondary text-white border-secondary'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p || 'auto'}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    updateSlot(activeSlot, {
                      posX: 50, posY: 50, scale: 1, fit: 'cover',
                      width: '', height: '',
                    })
                  }
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  title="Mərkəzlə və sıfırla"
                >
                  <Crosshair size={12} />
                  Mərkəzlə
                </button>
                <span className="text-[10px] text-gray-500">
                  Bu parametrlər yalnız bu şəklə tətbiq olunur
                </span>
              </div>
            </div>
          )}

          {/* === Detallı tənzimləmələr === */}
          <div className="rounded-lg border border-gray-200 p-2.5 mb-3 bg-gray-50/60">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ölçü və görünüş
            </div>

            {/* Sıra 1: En + Hündürlük (free text + presets) */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">En (width)</span>
                <input
                  type="text"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="100% / 600px / 50vw"
                  className="px-2 py-1 border border-gray-300 rounded text-xs bg-white w-full"
                />
                <div className="flex gap-1 flex-wrap">
                  {['25%', '50%', '75%', '100%'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setWidth(p)}
                      className={`px-1.5 py-0.5 text-[10px] rounded border ${
                        width === p
                          ? 'bg-secondary text-white border-secondary'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">Hündürlük (height)</span>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={heightMode === 'fixed' ? `${heightPx}px` : 'auto'}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (!v || v === 'auto') {
                        setHeightMode('auto');
                      } else {
                        const m = v.match(/(\d+)/);
                        if (m) {
                          setHeightMode('fixed');
                          setHeightPx(parseInt(m[1], 10));
                        }
                      }
                    }}
                    placeholder="auto / 420px"
                    className="px-2 py-1 border border-gray-300 rounded text-xs bg-white flex-1"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setHeightMode('auto')}
                    className={`px-1.5 py-0.5 text-[10px] rounded border ${
                      heightMode === 'auto'
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    auto
                  </button>
                  {[300, 420, 600].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setHeightMode('fixed'); setHeightPx(p); }}
                      className={`px-1.5 py-0.5 text-[10px] rounded border ${
                        heightMode === 'fixed' && heightPx === p
                          ? 'bg-secondary text-white border-secondary'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}px
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {/* Sıra 2: Nisbət + Boşluq */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">Nisbət (aspect)</span>
                <select
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value)}
                  disabled={heightMode === 'fixed'}
                  className="px-2 py-1 border border-gray-300 rounded text-xs bg-white disabled:opacity-50"
                  title={heightMode === 'fixed' ? 'Sabit hündürlükdə nisbət istifadə edilmir' : ''}
                >
                  {ASPECTS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">Boşluq: {gap}px</span>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={gap}
                  onChange={(e) => setGap(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </label>
            </div>

            {/* Sıra 3: Künc yumruluğu + Düzlənmə */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">Künc: {radius}px</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </label>
              <div className="flex flex-col text-xs text-gray-700 gap-1">
                <span className="font-medium">Düzlənmə</span>
                <div className="inline-flex border border-gray-300 rounded overflow-hidden bg-white">
                  {[
                    { v: 'left', icon: AlignLeft, t: 'Sol' },
                    { v: 'center', icon: AlignCenter, t: 'Mərkəz' },
                    { v: 'right', icon: AlignRight, t: 'Sağ' },
                  ].map(({ v, icon: Icon, t }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAlign(v)}
                      title={t}
                      disabled={width === '100%'}
                      className={`flex-1 flex items-center justify-center py-1 transition ${
                        align === v
                          ? 'bg-secondary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">
              {filledCount}/{slotCount} şəkil
            </span>
            <div className="flex gap-2 ml-auto">
              {isEditing && (
                <button
                  type="button"
                  onClick={deleteCollage}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md text-red-600 hover:bg-red-50"
                  title="Kollajı sil"
                >
                  <Trash2 size={14} />
                  Sil
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-100"
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={insertOrUpdate}
                disabled={filledCount < 2}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {isEditing ? 'Yenilə' : 'Daxil et'}
              </button>
            </div>
          </div>

          {/* Gizli file input (slot-lara şəkil yüklə) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
        </div>,
        document.body
      )}

      {/* Crop dialoqu (popover-dən kənar render olunur) */}
      <CollageCropDialog
        open={cropOpen}
        file={pendingFile}
        aspect={aspect}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </>
  );
}
```

## `components/editor/parts/CollageCropDialog.jsx`

<sup>223 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  CollageCropDialog — kollaj slot-una şəkil əlavə edərkən açılan
 *  yüngül crop dialoqu. react-easy-crop istifadə edir.
 *
 *  Props:
 *    - open       : boolean
 *    - file       : File (yeni seçilmiş)
 *    - aspect     : '4/3' | '16/9' | '1/1' | '3/4' | 'auto' (string)
 *    - onCancel() : dialoqu bağla
 *    - onConfirm(blob) : crop-dan keçmiş Blob qaytarır
 * ===================================================================== */

// React
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// UI / components
import Cropper from 'react-easy-crop';

// Icons
import { X, Check, ZoomIn, ZoomOut, RotateCw, RotateCcw } from 'lucide-react';

/** "4/3" → 4/3 ; "auto" → undefined (sərbəst crop) */
function aspectToNumber(aspect) {
  if (!aspect || aspect === 'auto') return undefined;
  const [w, h] = String(aspect).split('/').map(Number);
  if (!w || !h) return undefined;
  return w / h;
}

async function cropToBlob(imageSrc, pixelCrop, rotation, quality = 0.88) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (rotation) {
    // Rotation üçün ayrı kanvas-da çevir, sonra crop et
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const rW = image.width * cos + image.height * sin;
    const rH = image.width * sin + image.height * cos;

    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rW;
    rotCanvas.height = rH;
    const rctx = rotCanvas.getContext('2d');
    rctx.translate(rW / 2, rH / 2);
    rctx.rotate(rad);
    rctx.drawImage(image, -image.width / 2, -image.height / 2);

    ctx.drawImage(
      rotCanvas,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );
  } else {
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height,
    );
  }

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality)
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function CollageCropDialog({ open, file, aspect, onCancel, onConfirm }) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const cropAspect = useMemo(() => aspectToNumber(aspect) ?? 4 / 3, [aspect]);

  /* File → DataURL */
  useEffect(() => {
    if (!open || !file) {
      setSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPixelCrop(null);
  }, [open, file]);

  const handleConfirm = useCallback(async () => {
    if (!src || !pixelCrop) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, pixelCrop, rotation);
      if (blob) onConfirm?.(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setBusy(false);
    }
  }, [src, pixelCrop, rotation, onConfirm]);

  if (!open || !mounted) return null;

  const dialog = (
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            Şəkli kollaj üçün kəs
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative w-full h-[60vh] min-h-[300px] bg-gray-900">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, area) => setPixelCrop(area)}
              showGrid
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-3 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <ZoomOut size={14} className="text-gray-400" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-secondary h-1.5"
            />
            <ZoomIn size={14} className="text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw size={14} className="text-gray-400" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 accent-secondary h-1.5"
            />
            <RotateCw size={14} className="text-gray-400" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
            >
              +90°
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !pixelCrop}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40"
          >
            <Check size={14} />
            {busy ? 'Kəsilir...' : 'Təsdiqlə'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
```

## `components/editor/parts/SliderPicker.jsx`

<sup>509 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  SliderPicker — toolbar düyməsi: çox-şəkilli responsiv carousel
 *  yaratmaq və ya mövcud sliderı redaktə etmək üçün modal.
 *
 *  İstifadə:
 *    <SliderPicker editor={editor} onImageUpload={onImageUpload} />
 *
 *  Funksiyalar:
 *    - 1+ şəkil yüklə (drag-and-drop və ya çoxlu seçim)
 *    - Hər slayd üçün altyazı (caption)
 *    - Avtomatik oynatma (yes/no + ms gecikmə)
 *    - Loop (sonsuz dövr), Naviqasiya oxları, Pagination nöqtələri
 *    - slidesPerView (1 / 2 / 3 / 4)
 *    - Hündürlük (sərbəst, məs. 360px / 50vh / auto)
 *    - Aralıq (gap, px) və künc radiusu
 *    - Mövcud slider node seçildikdə avtomatik EDIT rejimi.
 * ===================================================================== */

// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Icons
import {
  GalleryHorizontalEnd, X, Plus, Loader2, Trash2, Check, Pencil,
  ChevronLeft, ChevronRight, Play, Pause, Repeat,
} from 'lucide-react';

// Local
import { ToolbarButton } from './Primitives';
import { SLIDER_DEFAULTS } from './ImageSliderExtension';

const SPV_OPTIONS = [1, 2, 3, 4];

export default function SliderPicker({ editor, onImageUpload }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [slides, setSlides] = useState([]); // [{ src, alt, caption }]
  const [autoplay, setAutoplay] = useState(SLIDER_DEFAULTS.autoplay);
  const [autoplayDelay, setAutoplayDelay] = useState(SLIDER_DEFAULTS.autoplayDelay);
  const [loop, setLoop] = useState(SLIDER_DEFAULTS.loop);
  const [navigation, setNavigation] = useState(SLIDER_DEFAULTS.navigation);
  const [pagination, setPagination] = useState(SLIDER_DEFAULTS.pagination);
  const [slidesPerView, setSlidesPerView] = useState(SLIDER_DEFAULTS.slidesPerView);
  const [gap, setGap] = useState(SLIDER_DEFAULTS.gap);
  const [height, setHeight] = useState(SLIDER_DEFAULTS.height);
  const [radius, setRadius] = useState(SLIDER_DEFAULTS.radius);

  const [busy, setBusy] = useState(false);
  const [editingPos, setEditingPos] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  /* Body scroll lock + ESC */
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* Mövcud slider node seçildikdə EDIT rejimi */
  useEffect(() => {
    if (!editor) return;
    const handle = () => {
      const { state } = editor;
      const { from } = state.selection;
      const node = state.doc.nodeAt(from);
      if (node && node.type.name === 'imageSlider') {
        setEditingPos(from);
      } else if (state.selection?.node?.type?.name === 'imageSlider') {
        setEditingPos(state.selection.from);
      } else {
        setEditingPos(null);
      }
    };
    editor.on('selectionUpdate', handle);
    handle();
    return () => editor.off('selectionUpdate', handle);
  }, [editor]);

  const isEditing = editingPos != null;

  const loadFromSelected = useCallback(() => {
    if (!editor || editingPos == null) return;
    const node = editor.state.doc.nodeAt(editingPos);
    if (!node || node.type.name !== 'imageSlider') return;
    const a = node.attrs || {};
    setSlides(Array.isArray(a.images) ? [...a.images] : []);
    setAutoplay(!!a.autoplay);
    setAutoplayDelay(a.autoplayDelay ?? SLIDER_DEFAULTS.autoplayDelay);
    setLoop(a.loop !== false);
    setNavigation(a.navigation !== false);
    setPagination(a.pagination !== false);
    setSlidesPerView(a.slidesPerView || 1);
    setGap(a.gap ?? SLIDER_DEFAULTS.gap);
    setHeight(a.height || SLIDER_DEFAULTS.height);
    setRadius(a.radius ?? SLIDER_DEFAULTS.radius);
  }, [editor, editingPos]);

  const openModal = useCallback(() => {
    if (isEditing) loadFromSelected();
    else setSlides([]);
    setOpen(true);
  }, [isEditing, loadFromSelected]);

  /* Çoxlu fayl yüklə */
  const handleFiles = useCallback(
    async (files) => {
      if (!files?.length || !onImageUpload) return;
      setBusy(true);
      try {
        const newSlides = [];
        for (const file of files) {
          const url = await onImageUpload(file);
          if (url) {
            newSlides.push({
              src: url,
              alt: file.name?.replace(/\.[^/.]+$/, '') || '',
              caption: '',
            });
          }
        }
        setSlides((prev) => [...prev, ...newSlides]);
      } catch (err) {
        console.error('Slider upload failed:', err);
      } finally {
        setBusy(false);
      }
    },
    [onImageUpload]
  );

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    handleFiles(files);
  };

  const updateSlide = (i, patch) =>
    setSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const removeSlide = (i) =>
    setSlides((prev) => prev.filter((_, idx) => idx !== i));

  const moveSlide = (i, dir) =>
    setSlides((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const insertOrUpdate = useCallback(() => {
    if (!editor) return;
    const filled = slides.filter((s) => s && s.src);
    if (filled.length === 0) return;

    const attrs = {
      images: filled.map((s) => ({
        src: s.src,
        alt: s.alt || '',
        caption: (s.caption || '').toString(),
      })),
      autoplay: !!autoplay,
      autoplayDelay: Number(autoplayDelay) || 4000,
      loop: !!loop,
      navigation: !!navigation,
      pagination: !!pagination,
      slidesPerView: Number(slidesPerView) || 1,
      gap: Number(gap) || 0,
      height: height || 'auto',
      radius: Number(radius) || 0,
    };

    if (isEditing) {
      editor.chain().focus().updateAttributes('imageSlider', attrs).run();
    } else {
      editor.chain().focus().insertImageSlider(attrs).run();
    }
    setOpen(false);
  }, [editor, slides, autoplay, autoplayDelay, loop, navigation, pagination, slidesPerView, gap, height, radius, isEditing]);

  const heightPresets = ['240px', '320px', '420px', '560px', '50vh', '70vh', 'auto'];

  return (
    <>
      <ToolbarButton
        onClick={openModal}
        title={isEditing ? 'Sliderı redaktə et' : 'Şəkil sürüşdürücüsü (slider) yarat'}
        isActive={isEditing}
      >
        <GalleryHorizontalEnd size={16} />
      </ToolbarButton>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[2147482900] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="relative w-[min(98vw,1180px)] max-h-[94vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Başlıq */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <GalleryHorizontalEnd size={18} className="text-secondary" />
                {isEditing ? 'Slideri redaktə et' : 'Yeni şəkil slideri'}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                title="Bağla"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
              {/* SOL: slaydlar siyahısı */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Slaydlar ({slides.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Şəkil əlavə et
                  </button>
                </div>

                {slides.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="w-full h-48 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-secondary"
                  >
                    <Plus size={28} />
                    <span className="text-sm">Şəkilləri seçin və ya buraya buraxın</span>
                    <span className="text-[11px] text-gray-400">Birdən çox şəkil seçə bilərsiniz</span>
                  </button>
                ) : (
                  <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {slides.map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-white"
                      >
                        <div
                          className="w-24 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-200"
                          style={{ borderRadius: `${Math.min(radius, 12)}px` }}
                        >
                          <img
                            src={s.src}
                            alt={s.alt}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={s.alt || ''}
                            onChange={(e) => updateSlide(i, { alt: e.target.value })}
                            placeholder="Alt mətni (SEO)"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          />
                          <input
                            type="text"
                            value={s.caption || ''}
                            onChange={(e) => updateSlide(i, { caption: e.target.value })}
                            placeholder="Altyazı (görünür)"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveSlide(i, -1)}
                            disabled={i === 0}
                            className="p-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                            title="Yuxarı"
                          >
                            <ChevronLeft size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSlide(i, +1)}
                            disabled={i === slides.length - 1}
                            className="p-1 rounded hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                            title="Aşağı"
                          >
                            <ChevronRight size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSlide(i)}
                            className="p-1 rounded hover:bg-red-100 text-red-600"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SAĞ: parametrlər */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                    Davranış
                  </h4>

                  <label className="flex items-center justify-between text-xs text-gray-700 mb-2 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      {autoplay ? <Pause size={13} /> : <Play size={13} />}
                      Avtomatik oynatma
                    </span>
                    <input
                      type="checkbox"
                      checked={autoplay}
                      onChange={(e) => setAutoplay(e.target.checked)}
                      className="accent-secondary"
                    />
                  </label>
                  {autoplay && (
                    <label className="flex items-center justify-between text-xs text-gray-600 mb-2 gap-2 pl-5">
                      <span>Gecikmə (ms)</span>
                      <input
                        type="number"
                        min={500}
                        max={20000}
                        step={250}
                        value={autoplayDelay}
                        onChange={(e) => setAutoplayDelay(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between text-xs text-gray-700 mb-2 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Repeat size={13} />
                      Loop (sonsuz dövr)
                    </span>
                    <input
                      type="checkbox"
                      checked={loop}
                      onChange={(e) => setLoop(e.target.checked)}
                      className="accent-secondary"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-gray-700 mb-2 cursor-pointer">
                    <span>Naviqasiya oxları</span>
                    <input
                      type="checkbox"
                      checked={navigation}
                      onChange={(e) => setNavigation(e.target.checked)}
                      className="accent-secondary"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
                    <span>Səhifələmə nöqtələri</span>
                    <input
                      type="checkbox"
                      checked={pagination}
                      onChange={(e) => setPagination(e.target.checked)}
                      className="accent-secondary"
                    />
                  </label>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <h4 className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                    Görünüş
                  </h4>

                  <label className="block text-xs text-gray-700 mb-2">
                    Görünən slayd sayı
                    <div className="flex gap-1 mt-1">
                      {SPV_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSlidesPerView(n)}
                          className={`flex-1 px-2 py-1 text-xs rounded border ${
                            slidesPerView === n
                              ? 'bg-secondary text-white border-secondary'
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="block text-xs text-gray-700 mb-2">
                    Hündürlük
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="360px / 50vh / auto"
                      className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    />
                    <div className="flex gap-1 flex-wrap mt-1">
                      {heightPresets.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setHeight(p)}
                          className={`px-1.5 py-0.5 text-[10px] rounded border ${
                            height === p
                              ? 'bg-secondary text-white border-secondary'
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </label>

                  <label className="block text-xs text-gray-700 mb-2">
                    Aralıq (gap, px)
                    <input
                      type="number"
                      min={0}
                      max={64}
                      value={gap}
                      onChange={(e) => setGap(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    />
                  </label>

                  <label className="block text-xs text-gray-700">
                    Künc radiusu (px)
                    <input
                      type="number"
                      min={0}
                      max={48}
                      value={radius}
                      onChange={(e) => setRadius(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={insertOrUpdate}
                disabled={slides.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40"
              >
                {isEditing ? <Pencil size={13} /> : <Check size={13} />}
                {isEditing ? 'Yenilə' : 'Yarat'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
```
