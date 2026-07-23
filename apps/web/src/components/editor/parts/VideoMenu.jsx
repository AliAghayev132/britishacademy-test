'use client';

/* =====================================================================
 *  VideoMenu — YouTube linki və ya fayldan video yükləmə.
 *
 *  Yeni xüsusiyyətlər:
 *    - Yükləmə progress bar-ı (0-100%) — onVideoUpload-a 2-ci arqument
 *      kimi `onProgress(percent)` callback-i ötürülür. Hook XHR əsaslı
 *      olduqda real progress, fetch əsaslı olduqda simulyasiya işləyir.
 *    - Hər bölmənin altında açılır izah bloku.
 * ===================================================================== */

import { useEffect, useRef, useState } from 'react';
import { Video, Upload, Check, HelpCircle, ChevronDown, X } from 'lucide-react';
import { ToolbarButton } from './Primitives';

const ACCEPT = 'video/mp4,video/webm,video/ogg';
const MAX_MB = 100;

export default function VideoMenu({ editor, onVideoUpload }) {
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const ref = useRef(null);
  const fileRef = useRef(null);
  const simIntervalRef = useRef(null);
  const realProgressRef = useRef(false); // hook progress callback-i çağırdımı?

  /* Click-outside */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  /* Cleanup */
  useEffect(
    () => () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    },
    []
  );

  const stopSim = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  /** Real progress yoxdursa, 0→90% asta simulyasiya. */
  const startSim = () => {
    stopSim();
    realProgressRef.current = false;
    setProgress(0);
    simIntervalRef.current = setInterval(() => {
      if (realProgressRef.current) {
        stopSim();
        return;
      }
      setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) / 12) : p));
    }, 200);
  };

  const insertYoutube = () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    try {
      editor.commands.setYoutubeVideo({ src: url });
      setYoutubeUrl('');
      setOpen(false);
    } catch {
      setError('YouTube linki düzgün deyil');
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onVideoUpload) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(
        `Fayl maksimum ${MAX_MB} MB ola bilər (cari: ${(file.size / 1024 / 1024).toFixed(1)} MB)`
      );
      return;
    }

    setError('');
    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    startSim();

    const onProgress = (pct) => {
      realProgressRef.current = true;
      stopSim();
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    try {
      // Hook 2-ci arqumenti dəstəkləyirsə real progress, dəstəkləmirsə yox sayılır.
      const url = await onVideoUpload(file, onProgress);
      stopSim();
      setProgress(100);

      if (url) {
        editor
          .chain()
          .focus()
          .insertContent(
            `<div data-video-wrapper="true"><video controls src="${url}" style="max-width:100%; height:auto;"></video></div>`
          )
          .run();
      }
      setTimeout(() => {
        setUploading(false);
        setFileName('');
        setProgress(0);
        setOpen(false);
      }, 600);
    } catch (err) {
      console.error('Video upload failed:', err);
      stopSim();
      setUploading(false);
      setProgress(0);
      setError(err?.message || 'Video yüklənmədi');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton onClick={() => setOpen((p) => !p)} title="Video əlavə et" isActive={open}>
        <Video size={16} />
      </ToolbarButton>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl
                     border border-gray-200 p-3 z-50 w-[340px]"
        >
          {/* YouTube */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-1.5">YouTube linki</p>
            <div className="flex gap-1">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') insertYoutube();
                }}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md
                           focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                type="button"
                onClick={insertYoutube}
                disabled={!youtubeUrl}
                className="px-2.5 py-1.5 text-xs bg-secondary text-white rounded-md
                           hover:bg-secondary/90 disabled:opacity-40 flex items-center gap-1"
              >
                <Check size={14} /> Əlavə et
              </button>
            </div>
            <Help title="YouTube videosu necə əlavə edilir?">
              <ul className="space-y-1 list-disc pl-4">
                <li>YouTube videosunun ünvan zolağındakı linki kopyalayın.</li>
                <li>
                  Yuxarıdakı sahəyə yapışdırın və <b>Enter</b> basın və ya{' '}
                  <b>Əlavə et</b> düyməsini sıxın.
                </li>
                <li>
                  Dəstəklənən formatlar: <code>youtube.com/watch?v=...</code>,{' '}
                  <code>youtu.be/...</code>, <code>youtube.com/embed/...</code>
                </li>
              </ul>
            </Help>
          </div>

          {/* File upload */}
          {onVideoUpload && (
            <div className="border-t border-gray-100 pt-2.5">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Fayl yüklə</p>

              {!uploading && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm
                             text-gray-600 hover:bg-secondary/5 rounded-md border-2 border-dashed
                             border-gray-300 hover:border-secondary transition"
                >
                  <Upload size={16} />
                  <span>Fayl seç (mp4, webm, ogg) — max {MAX_MB} MB</span>
                </button>
              )}

              {uploading && (
                <div className="border border-secondary/30 bg-secondary/5 rounded-md p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs text-gray-700 truncate flex-1" title={fileName}>
                      {fileName || 'Yüklənir...'}
                    </span>
                    <span className="text-xs font-bold text-secondary tabular-nums">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all duration-200 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {!realProgressRef.current && progress < 100 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Yükləmə davam edir, zəhmət olmasa gözləyin...
                    </p>
                  )}
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFile}
                className="hidden"
              />

              {error && (
                <div className="mt-2 flex items-start gap-1.5 px-2 py-1.5 text-xs
                                text-red-700 bg-red-50 border border-red-200 rounded">
                  <span className="flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <Help title="Faylı necə yükləməli?">
                <ul className="space-y-1 list-disc pl-4">
                  <li>Yuxarıdakı sahəyə klikləyib kompüterinizdən video faylını seçin.</li>
                  <li>
                    Dəstəklənən formatlar: <b>MP4</b>, <b>WebM</b>, <b>OGG</b>.
                  </li>
                  <li>
                    Maksimum ölçü: <b>{MAX_MB} MB</b>. Daha böyük faylları əvvəl sıxışdırın.
                  </li>
                  <li>Yükləmə zamanı status zolağı faiz şəklində nə qədər qaldığını göstərir.</li>
                  <li>Yükləmə bitdikdə video avtomatik olaraq mətnə əlavə olunur.</li>
                </ul>
              </Help>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Help({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-md overflow-hidden mt-2">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                   font-medium text-blue-700 hover:bg-blue-50"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={12} />
          {title}
        </span>
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 py-2 text-[11px] text-blue-900/80 leading-relaxed border-t border-blue-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
