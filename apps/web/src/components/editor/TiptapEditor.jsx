'use client';

/* =====================================================================
 *  TiptapEditor — BDU admin paneli üçün zəngin mətn redaktoru
 *  ----------------------------------------------------------------------
 *  Bu fayl yalnız orkestrasiya rolunu oynayır:
 *    - Tiptap `useEditor` hook-unu çağırır.
 *    - Bütün toolbar UI-ı `parts/` qovluğundakı kiçik komponentlərdən
 *      yığır (HeadingDropdown, ColorPickerPopover, TableMenu,
 *      MathPicker, ImageToolbar, LinkInput, VideoMenu, ...).
 *    - Tam ekran rejimi, önizləmə, statistika və ümumi əməliyyatlar
 *      (kopyala, təmizlə) burada idarə olunur.
 *
 *  Hər bir UI alt-komponenti müstəqil popover state və click-outside
 *  məntiqinə sahibdir — beləliklə re-render xərcləri minimuma enir.
 * ===================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import 'katex/dist/katex.min.css';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, CodeXml,
  List, ListOrdered, Quote, Undo, Redo, ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Eye, Edit3, Minus as MinusIcon, RotateCcw, Maximize2, Minimize2,
  Copy, Check, FileText, Hash,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  RemoveFormatting,
} from 'lucide-react';
import Swal from 'sweetalert2';

import { ToolbarButton, Divider } from './parts/Primitives';
import HeadingDropdown from './parts/HeadingDropdown';
import ColorPickerPopover from './parts/ColorPickerPopover';
import TableMenu from './parts/TableMenu';
import MathPicker from './parts/MathPicker';
import ImageToolbar from './parts/ImageToolbar';
import LinkInput from './parts/LinkInput';
import VideoMenu from './parts/VideoMenu';
import FileMenu from './parts/FileMenu';
import CollagePicker from './parts/CollagePicker';
import SliderPicker from './parts/SliderPicker';
import FontPicker from './parts/FontPicker';
import { buildExtensions } from './parts/extensions';
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
  const [copied, setCopied] = useState(false);

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
      attributes: { class: 'focus:outline-none min-h-[300px] px-6 py-4' },
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
      }
    },
    [editor, onImageUpload]
  );

  /* ------------------------------------------------------------------ */
  /*  Sağ tərəf əməliyyatları                                            */
  /* ------------------------------------------------------------------ */
  const copyContent = useCallback(async () => {
    if (!editor) return;
    await navigator.clipboard.writeText(editor.getHTML());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editor]);

  const clearContent = useCallback(async () => {
    if (!editor) return;
    const r = await Swal.fire({
      title: 'Əminsiniz?',
      text: 'Bütün məzmun silinəcək.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2C4B62',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Bəli, təmizlə',
      cancelButtonText: 'Ləğv et',
      reverseButtons: true,
    });
    if (r.isConfirmed) editor.commands.clearContent();
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
        <div className="flex items-center gap-1 p-2 flex-wrap">
          {/* Başlıq seçimi */}
          <HeadingDropdown editor={editor} />
          <Divider />

          {/* Mətn formatı */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Qalın (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Maili (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Altdan xətt (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Üstündən xətt"
          >
            <Strikethrough size={16} />
          </ToolbarButton>

          {/* Vurğu və mətn rəngi */}
          <ColorPickerPopover editor={editor} variant="highlight" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Kod"
          >
            <Code size={16} />
          </ToolbarButton>
          <ColorPickerPopover editor={editor} variant="text" />

          <Divider />

          {/* Şrift ailəsi və ölçüsü */}
          <FontPicker editor={editor} />

          <Divider />

          {/* Düzləndirmə */}
          {[
            { a: 'left', I: AlignLeft, t: 'Sola düzlə' },
            { a: 'center', I: AlignCenter, t: 'Mərkəzə düzlə' },
            { a: 'right', I: AlignRight, t: 'Sağa düzlə' },
            { a: 'justify', I: AlignJustify, t: 'Hər iki tərəfə düzlə' },
          ].map(({ a, I, t }) => (
            <ToolbarButton
              key={a}
              onClick={() => editor.chain().focus().setTextAlign(a).run()}
              isActive={editor.isActive({ textAlign: a })}
              title={t}
            >
              <I size={16} />
            </ToolbarButton>
          ))}

          <Divider />

          {/* Siyahılar / sitat / kod bloku / ayırıcı xətt */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Nöqtəli siyahı"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Nömrəli siyahı"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Sitat"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Kod bloku"
          >
            <CodeXml size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Ayırıcı xətt"
          >
            <MinusIcon size={16} />
          </ToolbarButton>

          <Divider />

          {/* İndekslər, cədvəl, düstur */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Yuxarı indeks"
          >
            <SuperscriptIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Aşağı indeks"
          >
            <SubscriptIcon size={16} />
          </ToolbarButton>

          {/* Cədvəl menyusu (xana birləşdirmə, düzləndirmə, fon rəngi və s.) */}
          <TableMenu editor={editor} />

          {/* Düstur seçici (kateqoriyalar + axtarış + canlı önizləmə) */}
          <MathPicker editor={editor} />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Formatı təmizlə"
          >
            <RemoveFormatting size={16} />
          </ToolbarButton>

          {/* Yalnız şəkil seçildikdə göstərilən aləçtlər */}
          {isImage && <ImageToolbar editor={editor} />}

          <Divider />

          {/* Link, şəkil, video */}
          <LinkInput editor={editor} />
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            title="Şəkil yüklə"
          >
            <ImageIcon size={16} />
          </ToolbarButton>
          {onImageUpload && (
            <CollagePicker editor={editor} onImageUpload={onImageUpload} />
          )}
          {onImageUpload && (
            <SliderPicker editor={editor} onImageUpload={onImageUpload} />
          )}
          <VideoMenu editor={editor} onVideoUpload={onVideoUpload} />
          {onFileUpload && <FileMenu editor={editor} onFileUpload={onFileUpload} />}

          <Divider />

          {/* Tarixçə */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Geri al (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="İrəli al (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>

          {/* ============== Sağ tərəf: Kopyala / Təmizlə / Tam ekran / Önizləmə ============== */}
          <div className="ml-auto flex items-center gap-1">
            <ToolbarButton onClick={copyContent} title="HTML-i kopyala">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </ToolbarButton>
            <ToolbarButton onClick={clearContent} title="Təmizlə">
              <RotateCcw size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => setIsFullscreen((p) => !p)}
              title={isFullscreen ? 'Kiçilt' : 'Tam ekran'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </ToolbarButton>

            <Divider />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsPreview((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isPreview
                  ? 'bg-secondary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
              <span>{isPreview ? 'Redaktə' : 'Önizləmə'}</span>
            </button>
          </div>
        </div>

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
          <EditorContent
            editor={editor}
            className="min-h-full"
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
