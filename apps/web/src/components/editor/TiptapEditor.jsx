'use client';

/* =====================================================================
 *  TiptapEditor — BDU admin paneli üçün zəngin mətn redaktoru
 *  ----------------------------------------------------------------------
 *  Bu fayl yalnız orkestrasiya rolunu oynayır:
 *    - Tiptap `useEditor` hook-unu çağırır.
 *    - Alət panelini `parts/Toolbar` komponentinə həvalə edir — tablara
 *      bölünmüş lent: Mətn · Abzas · Əlavə et.
 *    - Tam ekran rejimi, önizləmə, statistika və ümumi əməliyyatlar
 *      (kopyala, təmizlə) burada idarə olunur.
 *
 *  Hər bir UI alt-komponenti müstəqil popover state və click-outside
 *  məntiqinə sahibdir — beləliklə re-render xərcləri minimuma enir.
 * ===================================================================== */

// React
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Editor
import { EditorContent, useEditor } from '@tiptap/react';
// Editor canvas stilləri (.ProseMirror h1..h4, siyahılar, cədvəl və s.)
// Bunsuz Tailwind preflight başlıqları sıfırlayır → başlıqlar "işləmir" görünür.
import '@/styles/editor-content.css';

// Icons
import { FileText, Hash } from 'lucide-react';

// UI / components
import { confirmDialog, notify } from '@/components/ui/feedback';

// Hooks
import { useFlash } from '@/hooks';

// Lib
import { copyText } from '@/lib';

// Local
import Toolbar from './parts/Toolbar';
import { buildExtensions } from './parts/extensions';

// Utils
import { sanitizeHtml } from '@/utils/sanitizeHtml';

export default function TiptapEditor({
  content = '',
  onChange,
  onImageUpload,
  onVideoUpload,
  onFileUpload,
  minHeight = 500,
  placeholder = 'Məzmununuzu buraya yazın...',
  maxCharacters = null,
}) {
  /* ------------------------------------------------------------------ */
  /*  Lokal UI state-i                                                  */
  /* ------------------------------------------------------------------ */
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, flashCopied] = useFlash(false, 2000);

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /*  Editor inisializasiyası                                           */
  /*  buildExtensions bütün lazımi extensions massivini qaytarır.       */
  /* ------------------------------------------------------------------ */
  const extensions = useMemo(
    () => buildExtensions({ placeholder, maxCharacters }),
    [placeholder, maxCharacters]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content || '',
    editorProps: {
      attributes: {
        // `flex-1` — YAZI SAHƏSİ QUTUNU TAM DOLDURSUN.
        //
        // Əvvəl burada `min-h-[300px]` yazılı idi, xarici qutu isə 500px
        // (`minHeight`). Yəni qutunun ALT 200 PİKSELİ ölü zona idi: orada
        // kliklənəndə redaktor deyil, boş sarğı elementi tutulurdu və kursor
        // qoyulmurdu. Aşağıya klikləmək ən təbii hərəkətdir — mətn oraya
        // yazılacaq kimi görünür.
        class: 'focus:outline-none flex-1 px-6 py-4',
        // Brauzerin yazma-təklifi/format popup-unu söndür (kliklədikdə narahat edirdi).
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML()),
  });

  /* Xarici `content` dəyişdikdə editor məzmununu sinxronlaşdır.
   * Bug #8: Tiptap v3-də setContent-in 2-ci arqumenti `options` obyektidir
   * (əvvəlki boolean `emitUpdate` deyil) — `{ emitUpdate: false }` istifadə et
   * ki, proqram-təyinli sinxron `onUpdate`-i tetikləməsin (sonsuz döngü riski). */
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  /* ESC ilə tam ekrandan çıxış */
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  /* ------------------------------------------------------------------ */
  /*  Şəkil yükləmə                                                     */
  /* ------------------------------------------------------------------ */
  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !onImageUpload || !editor) return;
      try {
        const url = await onImageUpload(file);
        if (!url) return;

        // Şəkli daxil et
        editor.chain().focus().setImage({ src: url }).run();

        // Yeni daxil edilmiş şəkli avtomatik seç ki, ImageToolbar dərhal görünsün.
        // setImage-dən sonra cursor şəkildən sonraya keçir → bir addım geri gedirik.
        try {
          const { state } = editor;
          const pos = Math.max(0, state.selection.from - 1);
          const node = state.doc.nodeAt(pos);
          if (node && node.type.name === 'image') {
            editor.chain().setNodeSelection(pos).run();
          }
        } catch (selErr) {
          console.warn('Image auto-select skipped:', selErr);
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        notify.error(err?.message || 'Şəkil yüklənmədi');
      }
    },
    [editor, onImageUpload]
  );

  /* ------------------------------------------------------------------ */
  /*  Sağ tərəf əməliyyatları                                            */
  /* ------------------------------------------------------------------ */
  const copyContent = useCallback(async () => {
    if (!editor) return;
    if (await copyText(editor.getHTML())) flashCopied();
    else notify.error('Kopyalana bilmədi');
  }, [editor, flashCopied]);

  const clearContent = useCallback(async () => {
    if (!editor) return;
    const ok = await confirmDialog({
      tone: 'warning',
      title: 'Əminsiniz?',
      text: 'Bütün məzmun silinəcək.',
      confirmText: 'Bəli, təmizlə',
      cancelText: 'Ləğv et',
    });
    if (ok) editor.commands.clearContent();
  }, [editor]);

  if (!editor) return null;

  const characterCount = editor.storage.characterCount?.characters() || 0;
  const wordCount = editor.storage.characterCount?.words() || 0;
  const isImage = editor.isActive('image');

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm
                  transition-all duration-300 ${
                    isFullscreen
                      ? 'fixed inset-0 z-[100] flex flex-col rounded-none border-none overflow-hidden'
                      : 'overflow-visible'
                  }`}
    >
      {/* ============== TOOLBAR (sticky) ==============
           - Adi rejimdə: səhifə scroll olunarkən viewport-un üstündə qalır.
           - Tam ekran rejimində: editor body öz daxili scroll-undadır,
             sticky orada da işləyir. */}
      <div
        className={`bg-gradient-to-b from-gray-50 to-white border-b border-gray-200
                    sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/85
                    ${isFullscreen ? '' : 'rounded-t-xl'}`}
      >
        <Toolbar
          editor={editor}
          onPickImage={() => fileInputRef.current?.click()}
          onImageUpload={onImageUpload}
          onVideoUpload={onVideoUpload}
          onFileUpload={onFileUpload}
          isPreview={isPreview}
          onTogglePreview={() => setIsPreview((p) => !p)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((p) => !p)}
          copied={copied}
          onCopy={copyContent}
          onClear={clearContent}
        />

        {/* ============== Statistika lentı ============== */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50/50
                        border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {wordCount} söz
            </span>
            <span className="flex items-center gap-1">
              <Hash size={12} />
              {characterCount} simvol
            </span>
          </div>
          {maxCharacters && (
            <span
              className={
                characterCount > maxCharacters * 0.9
                  ? 'text-orange-500 font-medium'
                  : ''
              }
            >
              {characterCount}/{maxCharacters}
            </span>
          )}
        </div>
      </div>

      {/* ============== EDITOR / ÖNİZLƏMƏ ============== */}
      <div
        className={isFullscreen ? 'flex-1 overflow-auto' : ''}
        style={isFullscreen ? {} : { minHeight }}
      >
        {isPreview ? (
          <div
            className="p-6 ProseMirror"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
            /* Bug #5: önizləməni də public render kimi sanitizasiyadan keçir
               (ardıcıllıq + admin məzmununda belə defense-in-depth). */
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(editor.getHTML()) }}
          />
        ) : (
          /* `flex flex-col` — içindəki `.ProseMirror` (flex-1) bütün
             hündürlüyü tutsun; bax `editorProps.attributes.class`. */
          <EditorContent
            editor={editor}
            className="min-h-full flex flex-col"
            style={{ minHeight: isFullscreen ? '100%' : minHeight }}
          />
        )}
      </div>

      {/* Gizli şəkil input-u */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
