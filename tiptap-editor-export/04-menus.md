# Menyular — fayl, video, cədvəl

Yükləmə axını bu üç komponentdən keçir. Hər biri `onUpload` tipli funksiyanı
prop kimi alır və nəticədə qaytarılan URL-i editora yazır.

## `components/editor/parts/FileMenu.jsx`

<sup>415 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  FileMenu — Tiptap editorda sənəd (PDF, Word, Excel və s.) yükləmə.
 *
 *  Xüsusiyyətlər:
 *    - İstifadəçi fayl seçir.
 *    - Faylın editorda görünəcək adını dəyişə bilər (default: faylın adı
 *      uzantısız). Boş qoyularsa orijinal ad istifadə olunur.
 *    - 0–100 MB ölçü limiti (server-də də yoxlanır).
 *    - Yükləmə progress bar-ı (XHR əsaslı `onProgress`).
 *    - Uğurla yükləndikdən sonra editorda kliklənə bilən link
 *      (download atributu + faylın adı + uzantı badge-i) əlavə edilir.
 * ===================================================================== */

// React
import { useEffect, useRef, useState } from 'react';

// Icons
import {
  FileText, Upload, Check, X, HelpCircle, ChevronDown, Paperclip,
} from 'lucide-react';

// Local
import { ToolbarButton } from './Primitives';

const ACCEPT = [
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt', '.csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
].join(',');

const MAX_MB = 100;

/** Uzantı → qısa badge etiketi */
function extLabel(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!ext || ext === name.toLowerCase()) return 'FILE';
  return ext.slice(0, 5).toUpperCase();
}

/** Faylın adından uzantını ayırır. */
function splitName(fullName = '') {
  const i = fullName.lastIndexOf('.');
  if (i <= 0) return { base: fullName, ext: '' };
  return { base: fullName.slice(0, i), ext: fullName.slice(i) };
}

/** Bayt → oxunaqlı ölçü */
function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

export default function FileMenu({ editor, onFileUpload }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const ref = useRef(null);
  const fileRef = useRef(null);
  const simIntervalRef = useRef(null);
  const realProgressRef = useRef(false);

  /* Click-outside */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        if (!uploading) setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, uploading]);

  /* Cleanup */
  useEffect(() => () => stopSim(), []);

  const stopSim = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

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

  const reset = () => {
    setFile(null);
    setDisplayName('');
    setProgress(0);
    setError('');
    setUploading(false);
    realProgressRef.current = false;
    stopSim();
  };

  const closeAll = () => {
    if (uploading) return;
    reset();
    setOpen(false);
  };

  const onFilePicked = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(
        `Fayl maksimum ${MAX_MB} MB ola bilər (cari: ${(f.size / 1024 / 1024).toFixed(1)} MB)`
      );
      return;
    }
    setError('');
    setFile(f);
    const { base } = splitName(f.name);
    setDisplayName(base);
  };

  const handleUpload = async () => {
    if (!file || !onFileUpload) return;

    setError('');
    setUploading(true);
    setProgress(0);
    startSim();

    const onProgress = (pct) => {
      realProgressRef.current = true;
      stopSim();
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    try {
      const customBase = displayName.trim();
      const result = await onFileUpload(file, customBase || null, onProgress);
      stopSim();
      setProgress(100);

      if (!result || !result.url) {
        throw new Error('Server cavab vermədi');
      }

      const visibleName =
        result.name ||
        (customBase ? `${customBase}${splitName(file.name).ext}` : file.name);

      const ext = extLabel(visibleName);
      const sizeStr = fmtSize(result.size ?? file.size);

      // Editorda kliklənə bilən, stillənmiş yükləmə bloku.
      const html = `
        <p>
          <a
            href="${result.url}"
            target="_blank"
            rel="noopener noreferrer"
            download="${visibleName}"
            class="bdu-file-link"
            data-file-link="true"
            style="
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 0.85rem;
              border: 1px solid #d1d5db;
              border-radius: 0.5rem;
              background: #f9fafb;
              text-decoration: none;
              color: #1f2937;
              font-size: 0.875rem;
              line-height: 1.2;
              max-width: 100%;
            "
          >
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 36px;
              padding: 0.15rem 0.4rem;
              border-radius: 0.25rem;
              background: #2C4B62;
              color: #fff;
              font-weight: 700;
              font-size: 0.65rem;
              letter-spacing: 0.05em;
            ">${ext}</span>
            <span style="font-weight: 600;">${escapeHtml(visibleName)}</span>
            ${sizeStr ? `<span style="color:#6b7280; font-size:0.75rem;">(${sizeStr})</span>` : ''}
          </a>
        </p>
      `.trim();

      editor.chain().focus().insertContent(html).run();

      setTimeout(() => {
        reset();
        setOpen(false);
      }, 500);
    } catch (err) {
      console.error('File upload failed:', err);
      stopSim();
      setUploading(false);
      setProgress(0);
      setError(err?.message || 'Fayl yüklənmədi');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        onClick={() => setOpen((p) => !p)}
        title="Sənəd yüklə (PDF, Word, Excel və s.)"
        isActive={open}
      >
        <Paperclip size={16} />
      </ToolbarButton>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl
                     border border-gray-200 p-3 z-50 w-[360px]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText size={14} className="text-secondary" />
              Sənəd yüklə
            </div>
            <button
              type="button"
              onClick={closeAll}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 p-0.5 disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>

          {/* Fayl seçimi */}
          {!file && !uploading && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 px-3 py-5 text-sm
                         text-gray-600 hover:bg-secondary/5 rounded-md border-2 border-dashed
                         border-gray-300 hover:border-secondary transition"
            >
              <Upload size={18} />
              <span>Sənəd seç</span>
              <span className="text-[10px] text-gray-400">
                PDF, Word, Excel, PowerPoint, mətn — max {MAX_MB} MB
              </span>
            </button>
          )}

          {/* Seçilmiş fayl + ad daxiletmə */}
          {file && !uploading && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="inline-flex items-center justify-center min-w-[36px] px-1.5 py-0.5 rounded bg-secondary text-white text-[10px] font-bold tracking-wider">
                  {extLabel(file.name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-500">{fmtSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Faylı dəyiş"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Faylın görünəcək adı (uzantısız)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={splitName(file.name).base}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md
                             focus:outline-none focus:ring-1 focus:ring-secondary"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Boş qoyularsa, faylın orijinal adı istifadə olunacaq.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold
                           text-white bg-secondary rounded-md hover:bg-secondary/90 transition"
              >
                <Check size={14} />
                Yüklə və əlavə et
              </button>
            </div>
          )}

          {/* Yüklənir */}
          {uploading && (
            <div className="border border-secondary/30 bg-secondary/5 rounded-md p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs text-gray-700 truncate flex-1">
                  {file?.name || 'Yüklənir...'}
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
            </div>
          )}

          {error && (
            <div className="mt-2 px-2.5 py-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Help */}
          <div className="mt-3 border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => setHelpOpen((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
            >
              <HelpCircle size={12} />
              Necə istifadə edilir?
              <ChevronDown
                size={12}
                className={`transition-transform ${helpOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {helpOpen && (
              <ul className="mt-1.5 text-[11px] text-gray-600 space-y-1 list-disc pl-4">
                <li>“Sənəd seç” düyməsini basıb kompüterinizdən faylı seçin.</li>
                <li>
                  Faylın editorda görünəcək adını <b>uzantısız</b> dəyişə
                  bilərsiniz (məsələn: <i>elan-2026</i>).
                </li>
                <li>“Yüklə və əlavə et” düyməsini basın — ad linkdə görünəcək.</li>
                <li>Yalnız sənəd faylları qəbul olunur (PDF, Word, Excel, PowerPoint, mətn).</li>
                <li>Maksimum ölçü: <b>{MAX_MB} MB</b>.</li>
              </ul>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        onChange={onFilePicked}
        className="hidden"
      />
    </div>
  );
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## `components/editor/parts/VideoMenu.jsx`

<sup>304 sətir</sup>

```jsx
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

// React
import { useEffect, useRef, useState } from 'react';

// Icons
import { Video, Upload, Check, HelpCircle, ChevronDown, X } from 'lucide-react';

// Local
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
```

## `components/editor/parts/TableMenu.jsx`

<sup>742 sətir</sup>

```jsx
'use client';

/* =====================================================================
 *  TableMenu — Tiptap editor üçün geniş cədvəl idarəetmə paneli.
 *
 *  Davranış:
 *    - Cədvəl XARİCİNDƏ: 10×10 grid + başlıq seçimi.
 *    - Cədvəl İÇİNDƏ: 4 tab — Quruluş / Rənglər / Sərhəd / Düzləndirmə.
 *
 *  Hər rəng panelində həm hazır palitra, həm də CUSTOM hex / native
 *  color picker var — istifadəçi istənilən rəngi seçə bilər.
 *
 *  Reaktivlik: editor-un `selectionUpdate` və `transaction` event-lərinə
 *  abunə oluruq və daxili `tick` state-i artırırıq.
 *
 *  Help: Hər tab-ın altında mavi rəngli "Necə istifadə edilir?"
 *  açılır-bağlanır izah bloku var.
 * ===================================================================== */

// React
import { useEffect, useRef, useState } from 'react';

// Icons
import {
  Table as TableIcon, Trash2, X,
  AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Merge, Split,
  Plus, Minus, Rows, Columns,
  Paintbrush, Type as TypeIcon, Square,
  Layers, Settings, Palette,
  HelpCircle, ChevronDown,
  Maximize2, Move,
} from 'lucide-react';

// Local
import { ToolbarButton } from './Primitives';
import {
  TABLE_CELL_BG_COLORS,
  TABLE_CELL_TEXT_COLORS,
  TABLE_BORDER_COLORS,
  TABLE_BORDER_WIDTHS,
  TABLE_BORDER_STYLES,
} from './constants';

const INSERT_GRID = 10;

export default function TableMenu({ editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('struct');
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const [withHeader, setWithHeader] = useState(true);
  const popRef = useRef(null);

  /* Editor seçimi dəyişdikdə re-render */
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const tick = () => force((n) => n + 1);
    editor.on('selectionUpdate', tick);
    editor.on('transaction', tick);
    return () => {
      editor.off('selectionUpdate', tick);
      editor.off('transaction', tick);
    };
  }, [editor]);

  /* Click outside */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!editor) return null;
  const inTable = editor.isActive('table');

  const run = (chainFn) => () => chainFn(editor.chain().focus()).run();

  const insertTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader }).run();
    setOpen(false);
    setTab('struct');
  };

  const setCellAttr = (key, value) =>
    editor.chain().focus().setCellAttribute(key, value).run();

  const setAlign = (a) => editor.chain().focus().setTextAlign(a).run();

  return (
    <div className="relative" ref={popRef}>
      <ToolbarButton
        onClick={() => setOpen((p) => !p)}
        isActive={open || inTable}
        title="Cədvəl"
      >
        <TableIcon size={16} />
      </ToolbarButton>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 mt-1 z-50 w-[380px] bg-white border
                     border-gray-200 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Başlıq */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TableIcon size={14} className="text-secondary" />
              {inTable ? 'Cədvəl redaktoru' : 'Yeni cədvəl yarat'}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Cədvəl xaricində */}
          {!inTable && (
            <InsertPanel
              hover={hover}
              setHover={setHover}
              withHeader={withHeader}
              setWithHeader={setWithHeader}
              onPick={insertTable}
            />
          )}

          {/* Cədvəl içində */}
          {inTable && (
            <>
              <div className="flex bg-gray-50 border-b border-gray-100 text-xs">
                <TabBtn active={tab === 'struct'}  onClick={() => setTab('struct')}  icon={Layers}>Quruluş</TabBtn>
                <TabBtn active={tab === 'style'}   onClick={() => setTab('style')}   icon={Palette}>Rənglər</TabBtn>
                <TabBtn active={tab === 'border'}  onClick={() => setTab('border')}  icon={Square}>Sərhəd</TabBtn>
                <TabBtn active={tab === 'align'}   onClick={() => setTab('align')}   icon={Settings}>Düzləndirmə</TabBtn>
              </div>

              <div className="p-3 max-h-[420px] overflow-y-auto">
                {tab === 'struct' && (
                  <StructPanel
                    run={run}
                    editor={editor}
                    setCellAttr={setCellAttr}
                  />
                )}
                {tab === 'style' && (
                  <StylePanel
                    onCellBg={(c) => setCellAttr('backgroundColor', c || null)}
                    onCellFg={(c) => setCellAttr('color', c || null)}
                  />
                )}
                {tab === 'border' && (
                  <BorderPanel
                    onColor={(c) => setCellAttr('borderColor', c || null)}
                    onWidth={(w) => setCellAttr('borderWidth', w || null)}
                    onStyle={(s) => setCellAttr('borderStyle', s || null)}
                  />
                )}
                {tab === 'align' && (
                  <AlignPanel setAlign={setAlign} editor={editor} setCellAttr={setCellAttr} />
                )}
              </div>

              <div className="border-t border-gray-100 p-2 bg-gray-50/50">
                <button
                  type="button"
                  onClick={run((c) => c.deleteTable())}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5
                             text-xs text-red-600 border border-red-200 rounded
                             hover:bg-red-50 transition"
                >
                  <Trash2 size={12} />
                  Cədvəli sil
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =================================================================== */
/*  Tab düyməsi                                                         */
/* =================================================================== */
function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-2 transition border-b-2 ${
        active
          ? 'border-secondary text-secondary bg-white font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
      }`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

/* =================================================================== */
/*  Yeni cədvəl yaratma paneli                                          */
/* =================================================================== */
function InsertPanel({ hover, setHover, withHeader, setWithHeader, onPick }) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Ölçü seç</span>
        <span className="font-medium text-gray-700">
          {hover.r > 0 ? `${hover.r} sətir × ${hover.c} sütun` : '— × —'}
        </span>
      </div>

      <div
        className="grid gap-0.5 mb-3"
        style={{ gridTemplateColumns: `repeat(${INSERT_GRID}, 1fr)` }}
        onMouseLeave={() => setHover({ r: 0, c: 0 })}
      >
        {Array.from({ length: INSERT_GRID * INSERT_GRID }, (_, i) => {
          const r = Math.floor(i / INSERT_GRID) + 1;
          const c = (i % INSERT_GRID) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(r, c)}
              className={`w-7 h-7 border rounded-sm transition ${
                active
                  ? 'bg-secondary border-secondary'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-400'
              }`}
            />
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none mb-2">
        <input
          type="checkbox"
          checked={withHeader}
          onChange={(e) => setWithHeader(e.target.checked)}
          className="accent-secondary"
        />
        Başlıq sətri ilə yarat
      </label>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Yuxarıdakı şəbəkədə üzərinə gəlib istədiyiniz <b>sətir × sütun</b> sayını seçin.</li>
          <li>Klikləyəndə cədvəl daxil edilir. Cədvələ klikləyəndə bu menyu redaktə rejiminə keçəcək.</li>
          <li>Sütunun ölçüsünü dəyişmək üçün xananın <b>sağ kənarına</b> mausu yaxınlaşdırın — mavi zolaq görünəcək, onu sürükləyin.</li>
          <li>Konkret en/hündürlük üçün <b>Quruluş</b> tabındakı <b>W / H</b> sahələrindən istifadə edin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Quruluş paneli                                                      */
/* =================================================================== */
function StructPanel({ run, editor, setCellAttr }) {
  const cellAttrs = {
    ...editor.getAttributes('tableCell'),
    ...editor.getAttributes('tableHeader'),
  };
  const currentPadding = cellAttrs.cellPadding || null;
  return (
    <div className="space-y-3">
      <Section title="Sətir">
        <Btn icon={Plus} onClick={run((c) => c.addRowBefore())}>Yuxarı əlavə</Btn>
        <Btn icon={Plus} onClick={run((c) => c.addRowAfter())}>Aşağı əlavə</Btn>
        <Btn icon={Minus} danger onClick={run((c) => c.deleteRow())}>Sətri sil</Btn>
      </Section>

      <Section title="Sütun">
        <Btn icon={Plus} onClick={run((c) => c.addColumnBefore())}>Sol əlavə</Btn>
        <Btn icon={Plus} onClick={run((c) => c.addColumnAfter())}>Sağ əlavə</Btn>
        <Btn icon={Minus} danger onClick={run((c) => c.deleteColumn())}>Sütunu sil</Btn>
      </Section>

      <Section title="Xanalar">
        <Btn icon={Merge} onClick={run((c) => c.mergeCells())}>Birləşdir</Btn>
        <Btn icon={Split} onClick={run((c) => c.splitCell())}>Böl</Btn>
        <Btn icon={Merge} onClick={run((c) => c.mergeOrSplit())}>Auto</Btn>
      </Section>

      <Section title="Başlıq">
        <Btn icon={Rows}     onClick={run((c) => c.toggleHeaderRow())}>Sətir</Btn>
        <Btn icon={Columns}  onClick={run((c) => c.toggleHeaderColumn())}>Sütun</Btn>
        <Btn icon={TableIcon} onClick={run((c) => c.toggleHeaderCell())}>Xana</Btn>
      </Section>

      {/* Xana ölçüsü (cari xana üçün) */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
          <Maximize2 size={10} /> Xana ölçüsü
        </div>
        <div className="flex items-center gap-2">
          <SizeInput
            label="W"
            currentAttr={editor.getAttributes('tableCell').cellWidth || editor.getAttributes('tableHeader').cellWidth}
            onCommit={(v) => setCellAttr('cellWidth', v)}
          />
          <SizeInput
            label="H"
            currentAttr={editor.getAttributes('tableCell').cellHeight || editor.getAttributes('tableHeader').cellHeight}
            onCommit={(v) => setCellAttr('cellHeight', v)}
          />
          <button
            type="button"
            onClick={() => {
              setCellAttr('cellWidth', null);
              setCellAttr('cellHeight', null);
            }}
            className="px-2 py-1 text-[10px] text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
            title="Xana ölçüsünü sıfırla"
          >
            Sıfırla
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Boş = avtomatik. Vahid yazılmasa <code>px</code> götürülür (məs: <code>120</code>, <code>50%</code>).
        </p>
      </div>

      {/* Xana daxili padding */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
          <Move size={10} /> Daxili boşluq (padding)
        </div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {['0', '2px', '4px', '8px', '12px', '16px', '20px'].map((p) => {
            const active = currentPadding === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCellAttr('cellPadding', p)}
                className={`px-2.5 py-1 text-xs border rounded transition ${
                  active
                    ? 'bg-secondary text-white border-secondary'
                    : 'border-gray-200 hover:bg-secondary/10 hover:border-secondary'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCellAttr('cellPadding', null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
            title="Default-a qaytar (4px)"
          >
            Default
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-1">
          Default 4px-dir. <b>0</b> seçərək tamamilə sıfırlamaq olar.
        </p>
        <SizeInput
          label="Özün"
          currentAttr={currentPadding}
          onCommit={(v) => setCellAttr('cellPadding', v)}
        />
      </div>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li><b>Sətir/Sütun</b> bölmələri ilə cari xananın yanına/sonuna sıra əlavə edin və ya silin.</li>
          <li><b>Birləşdir</b> seçilmiş bir neçə xananı tək xanaya çevirir; <b>Böl</b> birləşmiş xananı geri ayırır.</li>
          <li><b>Başlıq</b> bölməsində aktiv olan sətir/sütun/xananı `&lt;th&gt;` (başlıq) və ya `&lt;td&gt;` (adi) etmək olar.</li>
          <li>Xana ölçüsünü dəqiq vermək üçün <b>W</b> (en) və <b>H</b> (hündürlük) sahələrini doldurun.</li>
          <li>Çoxlu xana seçmək üçün xana üzərinə klikləyib mausu sürükləyin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Stil paneli — fon və mətn rəngi                                     */
/* =================================================================== */
function StylePanel({ onCellBg, onCellFg }) {
  return (
    <div className="space-y-4">
      <ColorBlock
        title="Xana fon rəngi"
        icon={Paintbrush}
        colors={TABLE_CELL_BG_COLORS}
        onPick={onCellBg}
        defaultHex="#FEF3C7"
        showTransparentLabel
      />
      <ColorBlock
        title="Mətn rəngi"
        icon={TypeIcon}
        colors={TABLE_CELL_TEXT_COLORS}
        onPick={onCellFg}
        defaultHex="#2C4B62"
      />

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Əvvəlcə cədvəldə bir və ya bir neçə xananı seçin.</li>
          <li>Hazır palitradan bir rəngə klikləyin və ya <b>Custom rəng</b> sahəsində istənilən rəngi seçin (color picker / hex kod).</li>
          <li>Şəffaf rəng seçimi (qırmızı xətli kvadrat) tətbiq olunmuş rəngi silir.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Sərhəd paneli                                                       */
/* =================================================================== */
function BorderPanel({ onColor, onWidth, onStyle }) {
  return (
    <div className="space-y-4">
      <ColorBlock
        title="Sərhəd rəngi"
        icon={Square}
        colors={TABLE_BORDER_COLORS}
        onPick={onColor}
        defaultHex="#2C4B62"
      />

      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
          Qalınlıq
        </div>
        <div className="flex flex-wrap gap-1">
          {TABLE_BORDER_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWidth(w)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded
                         hover:bg-secondary/10 hover:border-secondary transition"
            >
              {w}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onWidth(null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
          Stil
        </div>
        <div className="flex flex-wrap gap-1">
          {TABLE_BORDER_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyle(s.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded
                         hover:bg-secondary/10 hover:border-secondary transition"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onStyle(null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Sərhəd ayrıca xana üçün tətbiq olunur. Bütün cədvələ vermək üçün <b>Ctrl + A</b> ilə xanaları seçin.</li>
          <li>Əvvəl <b>rəngi</b>, sonra <b>qalınlığı</b> və <b>stili</b> seçin.</li>
          <li><b>Sıfırla</b> default sərhəddi (1px solid #d1d5db) qaytarır.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Düzləndirmə paneli                                                  */
/* =================================================================== */
function AlignPanel({ setAlign, editor, setCellAttr }) {
  const isAlign = (a) => editor.isActive({ textAlign: a });
  const cellAttrs = {
    ...editor.getAttributes('tableCell'),
    ...editor.getAttributes('tableHeader'),
  };
  const isVAlign = (v) => cellAttrs.verticalAlign === v;
  return (
    <div className="space-y-3">
      <Section title="Üfüqi">
        <Btn icon={AlignLeft}   active={isAlign('left')}   onClick={() => setAlign('left')}>Sol</Btn>
        <Btn icon={AlignCenter} active={isAlign('center')} onClick={() => setAlign('center')}>Mərkəz</Btn>
        <Btn icon={AlignRight}  active={isAlign('right')}  onClick={() => setAlign('right')}>Sağ</Btn>
      </Section>

      <Section title="Şaquli (yuxarı-aşağı)">
        <Btn icon={AlignVerticalJustifyStart}  active={isVAlign('top')}    onClick={() => setCellAttr('verticalAlign', 'top')}>Yuxarı</Btn>
        <Btn icon={AlignVerticalJustifyCenter} active={isVAlign('middle')} onClick={() => setCellAttr('verticalAlign', 'middle')}>Orta</Btn>
        <Btn icon={AlignVerticalJustifyEnd}    active={isVAlign('bottom')} onClick={() => setCellAttr('verticalAlign', 'bottom')}>Aşağı</Btn>
      </Section>

      <button
        type="button"
        onClick={() => setCellAttr('verticalAlign', null)}
        className="w-full px-2 py-1.5 text-[11px] text-gray-500 border border-dashed border-gray-300
                   rounded hover:bg-gray-50"
      >
        Şaquli düzləndirməni sıfırla
      </button>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li><b>Üfüqi</b> — xanadakı mətni sola, mərkəzə və ya sağa düzləndirir.</li>
          <li><b>Şaquli</b> — xananın yüksəkliyi böyükdürsə, mətnin xana daxilində yuxarı, ortada və ya aşağıda yerləşməsini təyin edir.</li>
          <li>Bir neçə xananı birdən formatlamaq üçün xanaları sürükləyərək seçin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* ===================================================================
 *  UI primitiv-ləri (yalnız bu fayl daxilində)
 * =================================================================== */

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
        {title}
      </div>
      <div className="grid grid-cols-3 gap-1">{children}</div>
    </div>
  );
}

function Btn({ icon: Icon, children, onClick, danger = false, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded transition truncate
        ${active
          ? 'bg-secondary text-white border-secondary'
          : danger
            ? 'text-red-600 border-red-200 hover:bg-red-50'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
    >
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}

/**
 * Rəng paneli: hazır palitra + custom hex / native picker.
 * `defaultHex` color input-un başlanğıc dəyəridir.
 */
function ColorBlock({
  title,
  icon: Icon,
  colors,
  onPick,
  defaultHex = '#000000',
  showTransparentLabel = false,
}) {
  const [hex, setHex] = useState(defaultHex);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
        <Icon size={10} />
        {title}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {colors.map((c, i) => {
          const isClear = !c;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c)}
              title={c || (showTransparentLabel ? 'Şəffaf' : 'Default')}
              className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition relative"
              style={{
                background: isClear
                  ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 8px 8px'
                  : c,
              }}
            >
              {isClear && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-5 h-px bg-red-500 rotate-45" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom rəng */}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={valid ? hex : defaultHex}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHex(v);
            // Native color picker dəyişdiyi an dərhal tətbiq et — Word-vari təcrübə
            onPick(v);
          }}
          className="w-9 h-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
          title="Color picker"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && valid) onPick(hex);
          }}
          placeholder="#RRGGBB"
          maxLength={7}
          className="flex-1 px-2 py-1 text-xs font-mono border border-gray-200 rounded
                     focus:outline-none focus:border-secondary"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => onPick(hex)}
          className="px-2 py-1 text-xs bg-secondary text-white rounded
                     hover:bg-secondary/90 disabled:opacity-40"
        >
          Tətbiq
        </button>
      </div>
    </div>
  );
}

/** Xana W / H input-u — boş = avtomatik */
function SizeInput({ label, currentAttr, onCommit }) {
  const [v, setV] = useState(currentAttr || '');
  useEffect(() => {
    setV(currentAttr || '');
  }, [currentAttr]);

  const commit = () => {
    const t = (v || '').trim();
    if (!t) {
      onCommit(null);
      return;
    }
    // əgər sırf rəqəmdirsə — px əlavə et
    onCommit(/^[0-9]+$/.test(t) ? `${t}px` : t);
  };

  return (
    <label className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs flex-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
      <input
        type="text"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            e.currentTarget.blur();
          }
        }}
        placeholder="auto"
        className="w-full bg-transparent outline-none font-medium"
      />
    </label>
  );
}

/* Açılır-bağlanır izah bloku */
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
        <ChevronDown
          size={12}
          className={`transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-3 py-2 text-[11px] text-blue-900/80 leading-relaxed border-t border-blue-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
```
