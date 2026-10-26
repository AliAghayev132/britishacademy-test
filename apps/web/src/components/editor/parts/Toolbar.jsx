'use client';

/* =====================================================================
 *  Toolbar — redaktorun alət paneli, TABLARA bölünmüş
 *  ----------------------------------------------------------------------
 *  Əvvəl bütün alətlər (~25 düymə, 8 açılan menyu) TƏK sətirdə idi və
 *  `flex-wrap` ilə dar ekranda 3-4 sıraya qırılırdı: panel hündürlüyü
 *  dəyişir, düymələrin yeri sürüşür, lazım olanı tapmaq çətinləşirdi.
 *
 *  İndi Word-vari lent: üç tab (Mətn · Abzas · Əlavə et) və hər tabda bir
 *  qısa sıra. Tabdan ASILI OLMAYARAQ həmişə görünənlər sağ tərəfdədir —
 *  geri/irəli, kopyala, təmizlə, tam ekran, önizləmə: onlar hər rejimdə
 *  lazımdır, tab arxasında gizlənməməlidir.
 *
 *  Şəkil seçiləndə `ImageToolbar` AYRICA kontekst sırası kimi aşağıda
 *  görünür (əvvəl ümumi sıranın ortasına girib düymələri yerindən
 *  oynadırdı).
 * ===================================================================== */

// React
import { useState } from 'react';

// Icons
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, CodeXml,
  List, ListOrdered, Quote, Undo, Redo, ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Eye, Edit3, Minus as MinusIcon, RotateCcw, Maximize2, Minimize2,
  Copy, Check, Type, Pilcrow, PlusSquare,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  RemoveFormatting,
} from 'lucide-react';

// Local
import { ToolbarButton, Divider } from './Primitives';
import HeadingDropdown from './HeadingDropdown';
import ColorPickerPopover from './ColorPickerPopover';
import TableMenu from './TableMenu';
import ImageToolbar from './ImageToolbar';
import LinkInput from './LinkInput';
import VideoMenu from './VideoMenu';
import FileMenu from './FileMenu';
import CollagePicker from './CollagePicker';
import SliderPicker from './SliderPicker';
import FontPicker from './FontPicker';

const TABS = [
  { id: 'text', label: 'Mətn', Icon: Type },
  { id: 'paragraph', label: 'Abzas', Icon: Pilcrow },
  { id: 'insert', label: 'Əlavə et', Icon: PlusSquare },
];

const ALIGNMENTS = [
  { a: 'left', I: AlignLeft, t: 'Sola düzlə' },
  { a: 'center', I: AlignCenter, t: 'Mərkəzə düzlə' },
  { a: 'right', I: AlignRight, t: 'Sağa düzlə' },
  { a: 'justify', I: AlignJustify, t: 'Hər iki tərəfə düzlə' },
];

/** Bir sıra alət — hündürlüyü sabit saxlayır, dar ekranda yana sürüşür. */
function ToolRow({ children }) {
  return (
    <div className="flex min-h-[42px] items-center gap-1 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
      {children}
    </div>
  );
}

function TextTab({ editor }) {
  const mark = (name, run, title, Icon) => (
    <ToolbarButton onClick={run} isActive={editor.isActive(name)} title={title}>
      <Icon size={16} />
    </ToolbarButton>
  );
  return (
    <ToolRow>
      <HeadingDropdown editor={editor} />
      <Divider />
      {mark('bold', () => editor.chain().focus().toggleBold().run(), 'Qalın (Ctrl+B)', Bold)}
      {mark('italic', () => editor.chain().focus().toggleItalic().run(), 'Maili (Ctrl+I)', Italic)}
      {mark('underline', () => editor.chain().focus().toggleUnderline().run(), 'Altdan xətt (Ctrl+U)', UnderlineIcon)}
      {mark('strike', () => editor.chain().focus().toggleStrike().run(), 'Üstündən xətt', Strikethrough)}
      <Divider />
      {/* Vurğu və mətn rəngi */}
      <ColorPickerPopover editor={editor} variant="highlight" />
      <ColorPickerPopover editor={editor} variant="text" />
      {mark('code', () => editor.chain().focus().toggleCode().run(), 'Kod', Code)}
      <Divider />
      <FontPicker editor={editor} />
      <Divider />
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Formatı təmizlə"
      >
        <RemoveFormatting size={16} />
      </ToolbarButton>
    </ToolRow>
  );
}

function ParagraphTab({ editor }) {
  const node = (name, run, title, Icon) => (
    <ToolbarButton onClick={run} isActive={editor.isActive(name)} title={title}>
      <Icon size={16} />
    </ToolbarButton>
  );
  return (
    <ToolRow>
      {ALIGNMENTS.map(({ a, I, t }) => (
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
      {node('bulletList', () => editor.chain().focus().toggleBulletList().run(), 'Nöqtəli siyahı', List)}
      {node('orderedList', () => editor.chain().focus().toggleOrderedList().run(), 'Nömrəli siyahı', ListOrdered)}
      {node('blockquote', () => editor.chain().focus().toggleBlockquote().run(), 'Sitat', Quote)}
      {node('codeBlock', () => editor.chain().focus().toggleCodeBlock().run(), 'Kod bloku', CodeXml)}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Ayırıcı xətt"
      >
        <MinusIcon size={16} />
      </ToolbarButton>
      <Divider />
      {node('superscript', () => editor.chain().focus().toggleSuperscript().run(), 'Yuxarı indeks', SuperscriptIcon)}
      {node('subscript', () => editor.chain().focus().toggleSubscript().run(), 'Aşağı indeks', SubscriptIcon)}
    </ToolRow>
  );
}

function InsertTab({ editor, onPickImage, onImageUpload, onVideoUpload, onFileUpload }) {
  return (
    <ToolRow>
      <LinkInput editor={editor} />
      <Divider />
      <ToolbarButton onClick={onPickImage} title="Şəkil yüklə">
        <ImageIcon size={16} />
      </ToolbarButton>
      {onImageUpload && <CollagePicker editor={editor} onImageUpload={onImageUpload} />}
      {onImageUpload && <SliderPicker editor={editor} onImageUpload={onImageUpload} />}
      <VideoMenu editor={editor} onVideoUpload={onVideoUpload} />
      {onFileUpload && <FileMenu editor={editor} onFileUpload={onFileUpload} />}
      <Divider />
      {/* Cədvəl menyusu (xana birləşdirmə, düzləndirmə, fon rəngi və s.) */}
      <TableMenu editor={editor} />
    </ToolRow>
  );
}

export default function Toolbar({
  editor,
  onPickImage,
  onImageUpload,
  onVideoUpload,
  onFileUpload,
  isPreview,
  onTogglePreview,
  isFullscreen,
  onToggleFullscreen,
  copied,
  onCopy,
  onClear,
}) {
  const [tab, setTab] = useState('text');
  const isImage = editor.isActive('image');

  return (
    <>
      {/* ── Tab zolağı + həmişə görünən əməliyyatlar ── */}
      <div className="flex items-center gap-2 px-2 pt-2">
        <div role="tablist" aria-label="Alət qrupları" className="flex items-center gap-1 rounded-lg bg-gray-100/80 p-0.5">
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                // Fokus redaktordan çıxmasın — seçim itərsə düymələr
                // «işləmir» kimi görünür.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-all ${
                  on ? 'bg-white text-[#00157A] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1">
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
          <Divider />
          <ToolbarButton onClick={onCopy} title="HTML-i kopyala">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </ToolbarButton>
          <ToolbarButton onClick={onClear} title="Təmizlə">
            <RotateCcw size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={onToggleFullscreen} title={isFullscreen ? 'Kiçilt' : 'Tam ekran'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </ToolbarButton>
          <Divider />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onTogglePreview}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
              isPreview ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">{isPreview ? 'Redaktə' : 'Önizləmə'}</span>
          </button>
        </div>
      </div>

      {/* ── Seçilmiş tabın alətləri ── */}
      {tab === 'text' && <TextTab editor={editor} />}
      {tab === 'paragraph' && <ParagraphTab editor={editor} />}
      {tab === 'insert' && (
        <InsertTab
          editor={editor}
          onPickImage={onPickImage}
          onImageUpload={onImageUpload}
          onVideoUpload={onVideoUpload}
          onFileUpload={onFileUpload}
        />
      )}

      {/* ── Kontekst sırası: yalnız şəkil seçiləndə ── */}
      {isImage && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-blue-100 bg-blue-50/60 px-2 py-1.5">
          <span className="flex-none pr-1 text-xs font-bold uppercase tracking-wide text-blue-700">Şəkil</span>
          <ImageToolbar editor={editor} />
        </div>
      )}
    </>
  );
}
