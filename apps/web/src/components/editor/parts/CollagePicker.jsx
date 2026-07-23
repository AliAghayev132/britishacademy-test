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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid, X, Plus, Loader2, Trash2, Check, Pencil,
  AlignLeft, AlignCenter, AlignRight, Settings2, Crosshair,
} from 'lucide-react';
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
