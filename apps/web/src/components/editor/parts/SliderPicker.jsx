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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  GalleryHorizontalEnd, X, Plus, Loader2, Trash2, Check, Pencil,
  ChevronLeft, ChevronRight, Play, Pause, Repeat,
} from 'lucide-react';
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
