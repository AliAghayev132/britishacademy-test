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

import { useEffect, useRef, useState } from 'react';
import {
  FileText, Upload, Check, X, HelpCircle, ChevronDown, Paperclip,
} from 'lucide-react';
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
