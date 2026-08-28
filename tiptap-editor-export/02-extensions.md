m# Genişlənmələr və sabitlər

`buildExtensions()` bütün TipTap genişlənmələrini bir massivdə qaytarır.
Kollaj və slayder layihəyə xas **öz node-larıdır** — HTML-ə `<figure>` kimi
yazılır, ona görə public render tərəfində əlavə JS tələb etmir.

## `components/editor/parts/extensions.js`

<sup>431 sətir</sup>

```js
'use client';

/* =====================================================================
 *  Editor extension-larının quraşdırılması.
 *
 *  Cədvəl xanaları (TableCell, TableHeader) aşağıdakı əlavə
 *  atributlarla genişləndirilib (Word/Excel-vari rəng tənzimləməsi):
 *    - backgroundColor : xana fon rəngi
 *    - color           : mətn rəngi
 *    - borderColor     : xana sərhəd rəngi
 *    - borderWidth     : xana sərhəd qalınlığı (məs: "2px")
 *    - borderStyle     : 'solid' | 'dashed' | 'dotted' | 'double'
 *
 *  Bütün stillər tək `style` atributu kimi render olunur. `renderHTML`
 *  override edilib ki, parent-in colspan/rowspan/colwidth dəyərləri
 *  itməsin (HTMLAttributes obyektindən gəlir).
 * ===================================================================== */

import StarterKit from '@tiptap/starter-kit';
import ImageBase from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
// TextStyle + rəsmi FontSize/FontFamily/Color (v3 text-style paketindən).
// StarterKit v3 artıq Underline və Link daxil edir — onları ayrıca əlavə etmirik.
import { TextStyle, FontSize, FontFamily, Color } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ImageCollage } from './ImageCollageExtension';
import { ImageSlider } from './ImageSliderExtension';

/* ------------------------------------------------------------------ */
/*  Image — `style` atributu ilə genişləndirilmiş şəkil node-u         */
/* ------------------------------------------------------------------ */
export const Image = ImageBase.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => {
          // Əgər figure içindəki img-dirsə, style-ı img-dən oxu
          const target = el.tagName === 'IMG' ? el : el.querySelector?.('img') || el;
          return target.getAttribute('style');
        },
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
      caption: {
        default: null,
        parseHTML: (el) => {
          // figure > figcaption oxu
          if (el.tagName === 'FIGURE') {
            return el.querySelector('figcaption')?.textContent || null;
          }
          return el.getAttribute('data-caption') || null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'figure.bdu-image-figure' },
      { tag: 'img[src]' },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const caption = node?.attrs?.caption;
    if (caption) {
      // figure ilə render et
      const { caption: _omit, ...imgAttrs } = HTMLAttributes;
      return [
        'figure',
        { class: 'bdu-image-figure', 'data-caption': caption },
        ['img', mergeAttributes(imgAttrs, { 'data-caption': caption })],
        ['figcaption', { class: 'bdu-image-caption' }, caption],
      ];
    }
    return ['img', HTMLAttributes];
  },

  /* -----------------------------------------------------------------
   *  NodeView — editor canvas-ında şəkli figure içərisində göstərir
   *  və altında HƏMIŞƏ editable bir caption sahəsi saxlayır.
   *
   *  Davranış:
   *   - Boş caption → placeholder ("Şəklə altyazı əlavə et…").
   *   - Caption-a klikləmək onu fokuslayır (PM şəkli node-select etmir).
   *   - Yazılan mətn 400ms debounce ilə node atribut-una yazılır.
   *   - Enter → commit + blur. Escape → blur.
   *   - ImageToolbar-dan gələn ölçü/float/style dəyişiklikləri update()-də
   *     applyImg() vasitəsilə dərhal şəkilə tətbiq olunur.
   * ----------------------------------------------------------------- */
  addNodeView() {
    return ({ node, getPos, editor }) => {
      // Mutable: hər update-də yenilənir ki, commit() köhnə caption-ı oxumasın.
      let currentNode = node;

      const figure = document.createElement('figure');
      figure.className = 'bdu-image-figure bdu-image-figure--editor';

      const img = document.createElement('img');
      figure.appendChild(img);

      const figcap = document.createElement('figcaption');
      figcap.className = 'bdu-image-caption bdu-image-caption--editable';
      figcap.setAttribute('contenteditable', 'true');
      figcap.setAttribute('data-placeholder', 'Şəklə altyazı əlavə et…');
      figcap.spellcheck = false;
      figure.appendChild(figcap);

      // Şəkil atributlarını DOM-a tətbiq et (src / alt / style / title).
      const applyImg = (n) => {
        const a = n.attrs || {};
        if (a.src) img.setAttribute('src', a.src);
        if (a.alt) img.setAttribute('alt', a.alt); else img.removeAttribute('alt');
        if (a.title) img.setAttribute('title', a.title); else img.removeAttribute('title');
        if (a.style) img.setAttribute('style', a.style); else img.removeAttribute('style');
        if (a.caption) img.setAttribute('data-caption', a.caption);
        else img.removeAttribute('data-caption');
      };

      const reflectEmpty = () => {
        const empty = (figcap.textContent || '').trim() === '';
        figcap.classList.toggle('is-empty', empty);
      };

      const setCaptionDom = (text) => {
        if (figcap.textContent !== text) figcap.textContent = text;
        reflectEmpty();
      };

      // İlk render
      applyImg(node);
      setCaptionDom(node.attrs.caption || '');

      // Caption mətnini node atribut-una yaz (debounce ilə).
      let saveTimer = null;
      const commit = () => {
        const text = (figcap.textContent || '').trim();
        const cur = currentNode.attrs.caption || '';
        if (text === cur) {
          reflectEmpty();
          return;
        }
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos == null) return;
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...currentNode.attrs,
          caption: text || null,
        });
        // Dispatch zamanı seçim/scroll dəyişməsin.
        editor.view.dispatch(tr.setMeta('addToHistory', true));
        reflectEmpty();
      };

      figcap.addEventListener('input', () => {
        reflectEmpty();
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(commit, 400);
      });
      figcap.addEventListener('blur', () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        commit();
      });

      // ProseMirror keymap-larının (Enter, Escape, Ctrl+B v.s.) figcaption
      // daxilində aktivləşməməsi üçün event-ləri bloklayırıq.
      figcap.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          figcap.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          // Dəyişiklikləri saxlamadan ilkin caption-a qaytar.
          setCaptionDom(currentNode.attrs.caption || '');
          figcap.blur();
        }
      });

      // Caption-a klik şəkli node-select etməsin.
      figcap.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      figcap.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      return {
        dom: figure,
        contentDOM: null,
        update(updatedNode) {
          if (updatedNode.type.name !== 'image') return false;
          currentNode = updatedNode;
          applyImg(updatedNode);
          // Caption kənardan dəyişəndə (məs. ImageToolbar input) — focus
          // bizdə deyilsə DOM-u yenilə. Focus bizdədirsə istifadəçinin
          // yazısını üstələmərik.
          if (document.activeElement !== figcap) {
            setCaptionDom(updatedNode.attrs.caption || '');
          }
          return true;
        },
        // Caption daxilindəki bütün DOM mutasiyalarını PM-ə ötürmə.
        ignoreMutation(mutation) {
          return figcap === mutation.target || figcap.contains(mutation.target);
        },
        // Caption daxilindəki bütün event-lər contenteditable-ə aiddir, PM-ə yox.
        stopEvent(event) {
          return figcap === event.target || figcap.contains(event.target);
        },
        destroy() {
          if (saveTimer) clearTimeout(saveTimer);
        },
      };
    };
  },
});

/* ------------------------------------------------------------------ */
/*  Cədvəl xanaları üçün ümumi köməkçilər                              */
/* ------------------------------------------------------------------ */

/** Atributlardan CSS `style` sətri qurur (boş key-lər atılır).
 *  Köşlər `!important` istəyir çünki global `.ProseMirror td/th { ... }`
 *  qaydaları (məs. padding/vertical-align) inline style ilen eğri
 *  sıra gerçəkləşdirilə bilər və zəiflədirə bilər. */
function buildCellStyleString(attrs) {
  const parts = [];
  if (attrs.backgroundColor) parts.push(`background-color: ${attrs.backgroundColor}`);
  if (attrs.color)           parts.push(`color: ${attrs.color}`);
  if (attrs.borderColor)     parts.push(`border-color: ${attrs.borderColor}`);
  if (attrs.borderWidth)     parts.push(`border-width: ${attrs.borderWidth}`);
  if (attrs.borderStyle)     parts.push(`border-style: ${attrs.borderStyle}`);
  if (attrs.cellWidth)       parts.push(`width: ${attrs.cellWidth}`);
  if (attrs.cellHeight)      parts.push(`height: ${attrs.cellHeight}`);
  if (attrs.verticalAlign) {
    parts.push(`vertical-align: ${attrs.verticalAlign} !important`);
    // Vəziyyət görünən olsun deyə, xıçık bir min-height verilir.
    // Yalnız uçuracaq cellHeight yoxdursa.
    if (!attrs.cellHeight) parts.push('min-height: 60px');
  }
  if (attrs.cellPadding != null && attrs.cellPadding !== '') {
    parts.push(`padding: ${attrs.cellPadding} !important`);
  }
  return parts.join('; ');
}

/** HTML xanasından inline style və ya data-* atributu oxu. */
function readCellStyleAttr(el, jsKey, dataKey) {
  const v = el.style?.[jsKey];
  if (v) return v;
  return el.getAttribute(`data-${dataKey}`) || null;
}

/**
 * TableCell / TableHeader üçün eyni rəng atributlarını əlavə edən factory.
 * Bütün atributların `renderHTML`-i boş obyekt qaytarır — yekun `style` sətri
 * node-un `renderHTML`-ində bir dəfə qurulur (Tiptap bu atribut renderHTML-lərini
 * birləşdirir; biz dublikatdan qaçmaq üçün burada heçnə qaytarmırıq).
 */
function withCellStyling(BaseNode) {
  return BaseNode.extend({
    addAttributes() {
      const parent = this.parent?.() || {};
      return {
        ...parent,
        backgroundColor: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'backgroundColor', 'bg'),
          renderHTML: () => ({}),
        },
        color: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'color', 'fg'),
          renderHTML: () => ({}),
        },
        borderColor: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'borderColor', 'bc'),
          renderHTML: () => ({}),
        },
        borderWidth: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'borderWidth', 'bw'),
          renderHTML: () => ({}),
        },
        borderStyle: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'borderStyle', 'bs'),
          renderHTML: () => ({}),
        },
        cellWidth: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'width', 'w'),
          renderHTML: () => ({}),
        },
        cellHeight: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'height', 'h'),
          renderHTML: () => ({}),
        },
        verticalAlign: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'verticalAlign', 'va'),
          renderHTML: () => ({}),
        },
        cellPadding: {
          default: null,
          parseHTML: (el) => readCellStyleAttr(el, 'padding', 'p'),
          renderHTML: () => ({}),
        },
      };
    },

    renderHTML({ node, HTMLAttributes }) {
      const tag = this.name === 'tableHeader' ? 'th' : 'td';
      const cellStyle = buildCellStyleString(node.attrs);

      // Mövcud style varsa (məs. text-align), yeni style ilə birləşdir.
      const existingStyle = HTMLAttributes.style || '';
      const merged = [existingStyle, cellStyle].filter(Boolean).join('; ');

      // Backup data atributları — clipboard / setContent zamanı qoruma
      const dataAttrs = {};
      if (node.attrs.backgroundColor) dataAttrs['data-bg'] = node.attrs.backgroundColor;
      if (node.attrs.color)           dataAttrs['data-fg'] = node.attrs.color;
      if (node.attrs.borderColor)     dataAttrs['data-bc'] = node.attrs.borderColor;
      if (node.attrs.borderWidth)     dataAttrs['data-bw'] = node.attrs.borderWidth;
      if (node.attrs.borderStyle)     dataAttrs['data-bs'] = node.attrs.borderStyle;
      if (node.attrs.cellWidth)       dataAttrs['data-w']  = node.attrs.cellWidth;
      if (node.attrs.cellHeight)      dataAttrs['data-h']  = node.attrs.cellHeight;
      if (node.attrs.verticalAlign)   dataAttrs['data-va'] = node.attrs.verticalAlign;
      if (node.attrs.cellPadding)     dataAttrs['data-p']  = node.attrs.cellPadding;

      return [
        tag,
        {
          ...HTMLAttributes,
          ...dataAttrs,
          ...(merged ? { style: merged } : {}),
        },
        0,
      ];
    },
  });
}

export const StyledTableCell   = withCellStyling(TableCell);
export const StyledTableHeader = withCellStyling(TableHeader);

/* ------------------------------------------------------------------ */
/*  Extension list builder                                             */
/* ------------------------------------------------------------------ */
export function buildExtensions({ placeholder, maxCharacters }) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      // StarterKit-in daxili Link-i (ayrıca Link əlavə etmirik — dublikat olmasın).
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
        },
      },
    }),
    Subscript,
    Superscript,
    // Şrift ölçüsü/ailəsi/rəngi — hamısı textStyle mark-ına bağlanır.
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),

    // Cədvəl: sütun ölçüsü drag ilə dəyişdirilə bilər
    Table.configure({
      resizable: true,
      allowTableNodeSelection: true,
      HTMLAttributes: { class: 'bdu-table' },
    }),
    TableRow,
    StyledTableCell,
    StyledTableHeader,

    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
      },
    }),
    ImageCollage,
    ImageSlider,
    Youtube.configure({
      inline: false,
      ccLanguage: 'az',
      HTMLAttributes: { class: 'youtube-video' },
    }),

    // Mətn düzləndirməsi — yalnız paraqraf və başlıq üçün.
    // Cədvəl xanası içərisində işlədiyini təmin etmək üçün xananin
    // içindeki <p>-ya birbaşa text-align verilir (xana səviyyəsində deyil).
    // Bu cüt yerdə atribut təyini qarışıqlığının qarşısını alır.
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),

    Placeholder.configure({ placeholder }),
    maxCharacters
      ? CharacterCount.configure({ limit: maxCharacters })
      : CharacterCount,
  ];
}
```

## `components/editor/parts/constants.js`

Şrift siyahısı, rəng palitrası, ölçü presetləri.

<sup>310 sətir</sup>

```js
/**
 * Editor sabitləri — rəng palitraları və düstur kitabxanası.
 *
 * Bütün sabitlər immutable saxlanılır ki, render-lərdə referans dəyişməsin
 * və lazımsız re-render-lər baş verməsin.
 */

import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mətn rəngi palitrası — 32 rəng (8 sütunda 4 sıra)                  */
/* ------------------------------------------------------------------ */
export const TEXT_COLORS = Object.freeze([
  // Neytral
  '#000000', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
  // Qırmızı / Çəhrayı
  '#E03131', '#F03E3E', '#FA5252', '#FF6B6B', '#C2255C', '#D6336C', '#E64980', '#F783AC',
  // Bənövşəyi / Göy
  '#9C36B5', '#7048E8', '#6741D9', '#4C6EF5', '#3B5BDB', '#1971C2', '#1C7ED6', '#0C8599',
  // Yaşıl / Sarı / Narıncı
  '#0CA678', '#099268', '#2F9E44', '#66A80F', '#FAB005', '#F08C00', '#E8590C', '#D9480F',
  // BDU brend
  '#AA9674', '#2C4B62',
]);

/* ------------------------------------------------------------------ */
/*  Vurğulama (highlight) palitrası — pastel tonlar                    */
/* ------------------------------------------------------------------ */
export const HIGHLIGHT_COLORS = Object.freeze([
  '#FEF3C7', '#FECACA', '#FED7AA', '#FDE68A', '#D9F99D', '#A7F3D0',
  '#A5F3FC', '#BAE6FD', '#C7D2FE', '#DDD6FE', '#FBCFE8', '#E5E7EB',
  '#FCD34D', '#FB7185', '#34D399', '#60A5FA', '#A78BFA', '#F472B6',
]);

/* ------------------------------------------------------------------ */
/*  Cədvəl xanaları üçün arxa fon rəngləri (yumşaq pastellərdən tutmuş
 *  doymuş tonlara qədər)                                              */
/* ------------------------------------------------------------------ */
export const TABLE_CELL_BG_COLORS = Object.freeze([
  '', // şəffaf
  '#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
  '#FEE2E2', '#FECACA', '#FCA5A5', '#EF4444', '#DC2626',
  '#FED7AA', '#FDBA74', '#F97316', '#EA580C',
  '#FEF3C7', '#FDE68A', '#FACC15', '#EAB308', '#CA8A04',
  '#D1FAE5', '#A7F3D0', '#6EE7B7', '#10B981', '#059669',
  '#DBEAFE', '#BFDBFE', '#93C5FD', '#3B82F6', '#1D4ED8',
  '#E0E7FF', '#C7D2FE', '#A5B4FC', '#6366F1', '#4338CA',
  '#FCE7F3', '#FBCFE8', '#F9A8D4', '#EC4899', '#BE185D',
  '#2C4B62', '#AA9674',
]);

/* ------------------------------------------------------------------ */
/*  Cədvəl xanaları üçün mətn rəngləri (kontrast üçün tünd ton + brend) */
/* ------------------------------------------------------------------ */
export const TABLE_CELL_TEXT_COLORS = Object.freeze([
  '', // default (CSS-dən gələn)
  '#000000', '#1F2937', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
  '#B91C1C', '#C2410C', '#A16207', '#15803D', '#1D4ED8', '#6D28D9', '#BE185D',
  '#2C4B62', '#AA9674',
]);

/* ------------------------------------------------------------------ */
/*  Sərhəd rəngləri                                                    */
/* ------------------------------------------------------------------ */
export const TABLE_BORDER_COLORS = Object.freeze([
  '', // default
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB',
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899',
  '#2C4B62', '#AA9674',
]);

/** Sərhəd qalınlıqları — px-də */
export const TABLE_BORDER_WIDTHS = Object.freeze(['1px', '2px', '3px', '4px', '6px']);

/** Sərhəd stilləri */
export const TABLE_BORDER_STYLES = Object.freeze([
  { value: 'solid',  label: 'Düz' },
  { value: 'dashed', label: 'Kəsik' },
  { value: 'dotted', label: 'Nöqtəli' },
  { value: 'double', label: 'İkiqat' },
]);

/* ------------------------------------------------------------------ */
/*  Başlıq səviyyələri                                                 */
/* ------------------------------------------------------------------ */
export const HEADING_OPTIONS = Object.freeze([
  { level: 1, label: 'Başlıq 1', icon: Heading1, desc: 'Ən böyük başlıq' },
  { level: 2, label: 'Başlıq 2', icon: Heading2, desc: 'Bölmə başlığı' },
  { level: 3, label: 'Başlıq 3', icon: Heading3, desc: 'Alt bölmə' },
  { level: 4, label: 'Başlıq 4', icon: Heading4, desc: 'Kiçik başlıq' },
  { level: 0, label: 'Normal mətn', icon: Type, desc: 'Paraqraf mətni' },
]);

/* ====================================================================
 *  DÜSTUR (FORMULA) KİTABXANASI
 *  Word-vari təcrübə üçün kateqoriyalara bölünmüş zəngin LaTeX dəstləri.
 *  Hər element: { label (ekran), latex (insert), keywords (axtarış üçün) }
 * ==================================================================== */

const sym = (label, latex, keywords = '') => ({ label, latex, keywords });

export const MATH_CATEGORIES = Object.freeze([
  {
    id: 'basic',
    name: 'Əsaslar',
    items: [
      sym('x²',     'x^{2}',                       'qudra ust square'),
      sym('xⁿ',     'x^{n}',                       'qudra ust power'),
      sym('x₂',     'x_{2}',                       'index alt subscript'),
      sym('√x',     '\\sqrt{x}',                   'kvadrat kok sqrt root'),
      sym('ⁿ√x',    '\\sqrt[n]{x}',                'kok n-ci'),
      sym('a/b',    '\\frac{a}{b}',                'kesir frac dilin'),
      sym('ⁿCₖ',    '\\binom{n}{k}',               'binom secim combination'),
      sym('|x|',    '\\left| x \\right|',          'modul absolute'),
      sym('⌊x⌋',    '\\lfloor x \\rfloor',         'floor'),
      sym('⌈x⌉',    '\\lceil x \\rceil',           'ceiling'),
      sym('x̄',      '\\bar{x}',                    'orta bar'),
      sym('x̂',      '\\hat{x}',                    'hat'),
      sym('x⃗',      '\\vec{x}',                    'vektor arrow'),
      sym('ẋ',      '\\dot{x}',                    'tochka derivative'),
      sym('ẍ',      '\\ddot{x}',                   'iki noqte'),
      sym('xʹ',     "x'",                          'derivative shtrix'),
    ],
  },
  {
    id: 'greek',
    name: 'Yunan hərfləri',
    items: [
      sym('α', '\\alpha', 'alpha'), sym('β', '\\beta', 'beta'),
      sym('γ', '\\gamma', 'gamma'), sym('δ', '\\delta', 'delta'),
      sym('ε', '\\epsilon', 'epsilon'), sym('ζ', '\\zeta', 'zeta'),
      sym('η', '\\eta', 'eta'), sym('θ', '\\theta', 'theta'),
      sym('ι', '\\iota', 'iota'), sym('κ', '\\kappa', 'kappa'),
      sym('λ', '\\lambda', 'lambda'), sym('μ', '\\mu', 'mu'),
      sym('ν', '\\nu', 'nu'), sym('ξ', '\\xi', 'xi'),
      sym('π', '\\pi', 'pi'), sym('ρ', '\\rho', 'rho'),
      sym('σ', '\\sigma', 'sigma'), sym('τ', '\\tau', 'tau'),
      sym('υ', '\\upsilon', 'upsilon'), sym('φ', '\\phi', 'phi'),
      sym('χ', '\\chi', 'chi'), sym('ψ', '\\psi', 'psi'),
      sym('ω', '\\omega', 'omega'),
      sym('Γ', '\\Gamma', 'Gamma'), sym('Δ', '\\Delta', 'Delta'),
      sym('Θ', '\\Theta', 'Theta'), sym('Λ', '\\Lambda', 'Lambda'),
      sym('Ξ', '\\Xi', 'Xi'), sym('Π', '\\Pi', 'Pi'),
      sym('Σ', '\\Sigma', 'Sigma'), sym('Φ', '\\Phi', 'Phi'),
      sym('Ψ', '\\Psi', 'Psi'), sym('Ω', '\\Omega', 'Omega'),
    ],
  },
  {
    id: 'operators',
    name: 'Operatorlar və münasibətlər',
    items: [
      sym('±',  '\\pm',         'plus minus'),
      sym('∓',  '\\mp',         'minus plus'),
      sym('×',  '\\times',      'vurma cross'),
      sym('÷',  '\\div',        'bolme div'),
      sym('·',  '\\cdot',       'nokte dot'),
      sym('∗',  '\\ast',        'asterisk'),
      sym('⊕',  '\\oplus',      'plus dair'),
      sym('⊗',  '\\otimes',     'cross dair'),
      sym('=',  '=',            'equals'),
      sym('≠',  '\\neq',        'beraber deyil not equal'),
      sym('≈',  '\\approx',     'tax beraber approx'),
      sym('≡',  '\\equiv',      'eyni equivalent'),
      sym('≅',  '\\cong',       'congruent'),
      sym('∼',  '\\sim',        'tilde similar'),
      sym('≤',  '\\leq',        'kicik beraber'),
      sym('≥',  '\\geq',        'boyuk beraber'),
      sym('≪',  '\\ll',         'cox kicik'),
      sym('≫',  '\\gg',         'cox boyuk'),
      sym('<',  '<',            'kicik less'),
      sym('>',  '>',            'boyuk greater'),
      sym('∝',  '\\propto',     'mutenasib proportional'),
    ],
  },
  {
    id: 'calculus',
    name: 'Hesab (calculus)',
    items: [
      sym('∑',   '\\sum_{i=1}^{n} x_i',                    'cem sum sigma'),
      sym('∏',   '\\prod_{i=1}^{n} x_i',                   'hasil product'),
      sym('∫',   '\\int_{a}^{b} f(x)\\,dx',                'integral'),
      sym('∬',   '\\iint_{D} f(x,y)\\,dA',                 'iki qat integral double'),
      sym('∭',   '\\iiint_{V} f\\,dV',                     'uc qat integral'),
      sym('∮',   '\\oint_{C} F\\cdot dr',                  'kontur integral'),
      sym('lim', '\\lim_{x \\to \\infty} f(x)',            'limit'),
      sym('∂',   '\\frac{\\partial f}{\\partial x}',       'qismi torme partial'),
      sym('d/dx','\\frac{d}{dx} f(x)',                     'tormə derivative'),
      sym('∇',   '\\nabla f',                              'nabla qradient'),
      sym('Δ',   '\\Delta x',                              'delta deyisme'),
      sym('∞',   '\\infty',                                'sonsuzluq infinity'),
      sym('e',   'e^{x}',                                  'exp eksponent'),
      sym('ln',  '\\ln(x)',                                'natural loqarifma'),
      sym('log', '\\log_{a}(x)',                           'loqarifma'),
    ],
  },
  {
    id: 'trig',
    name: 'Triqonometriya',
    items: [
      sym('sin',  '\\sin(x)',          'sinus'),
      sym('cos',  '\\cos(x)',          'kosinus'),
      sym('tan',  '\\tan(x)',          'tangens'),
      sym('cot',  '\\cot(x)',          'kotangens'),
      sym('sec',  '\\sec(x)',          'sekans'),
      sym('csc',  '\\csc(x)',          'kosekans'),
      sym('arcsin','\\arcsin(x)',      'arksinus'),
      sym('arccos','\\arccos(x)',      'arkkosinus'),
      sym('arctan','\\arctan(x)',      'arktangens'),
      sym('sinh', '\\sinh(x)',         'hiperbolik'),
      sym('cosh', '\\cosh(x)',         'hiperbolik kosinus'),
      sym('tanh', '\\tanh(x)',         'hiperbolik tangens'),
    ],
  },
  {
    id: 'sets',
    name: 'Çoxluqlar və məntiq',
    items: [
      sym('∈',  '\\in',           'aiddir element'),
      sym('∉',  '\\notin',        'aid deyil'),
      sym('∋',  '\\ni',           'saxlayir'),
      sym('⊂',  '\\subset',       'alt coxluq'),
      sym('⊆',  '\\subseteq',     'alt coxluq beraber'),
      sym('⊃',  '\\supset',       'ust coxluq'),
      sym('∪',  '\\cup',          'birlesme union'),
      sym('∩',  '\\cap',          'kesisme intersection'),
      sym('∅',  '\\emptyset',     'bos coxluq empty'),
      sym('∀',  '\\forall',       'her butun for all'),
      sym('∃',  '\\exists',       'movcuddur exists'),
      sym('∄',  '\\nexists',      'movcud deyil'),
      sym('¬',  '\\neg',          'inkar not'),
      sym('∧',  '\\land',         've and'),
      sym('∨',  '\\lor',          'veya or'),
      sym('⊕',  '\\oplus',        'xor'),
      sym('ℕ',  '\\mathbb{N}',    'natural eddet'),
      sym('ℤ',  '\\mathbb{Z}',    'tam eddet integers'),
      sym('ℚ',  '\\mathbb{Q}',    'rasional rationals'),
      sym('ℝ',  '\\mathbb{R}',    'helqiqi reals'),
      sym('ℂ',  '\\mathbb{C}',    'kompleks complex'),
    ],
  },
  {
    id: 'arrows',
    name: 'Oxlar',
    items: [
      sym('→',  '\\to',                'sag ox'),
      sym('←',  '\\leftarrow',         'sol ox'),
      sym('↔',  '\\leftrightarrow',    'iki terefli'),
      sym('⇒',  '\\Rightarrow',        'sag ikiqat'),
      sym('⇐',  '\\Leftarrow',         'sol ikiqat'),
      sym('⇔',  '\\Leftrightarrow',    'iff ikiterefli ikiqat'),
      sym('↑',  '\\uparrow',           'yuxari'),
      sym('↓',  '\\downarrow',         'asagi'),
      sym('↦',  '\\mapsto',            'maps to'),
      sym('⟶',  '\\longrightarrow',    'uzun sag ox'),
      sym('⟵',  '\\longleftarrow',     'uzun sol ox'),
    ],
  },
  {
    id: 'matrices',
    name: 'Matrislər və sistemlər',
    items: [
      sym('Matris (2×2)',
          '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
          'matrix matris pmatrix'),
      sym('Matris [ ]',
          '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
          'matrix kvadrat'),
      sym('Determinant',
          '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
          'determinant det'),
      sym('Matris (3×3)',
          '\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}',
          'matrix 3x3'),
      sym('Tənliklər sistemi',
          '\\begin{cases} x + y = 5 \\\\ x - y = 1 \\end{cases}',
          'sistem cases tenlik'),
      sym('Hissə-hissə funksiya',
          'f(x) = \\begin{cases} x, & x \\geq 0 \\\\ -x, & x < 0 \\end{cases}',
          'cases funksiya'),
      sym('Cəm + kəsr',
          '\\sum_{i=1}^{n} \\frac{1}{i^2}',
          'sum frac'),
      sym('Riemann inteqralı',
          '\\int_{a}^{b} f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i)\\,\\Delta x',
          'riemann sum integral'),
      sym('Düstur: kvadrat tənlik',
          'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
          'quadratic kvadrat tenlik kok'),
      sym('Pifaqor',
          'a^2 + b^2 = c^2',
          'pythagoras pifaqor'),
      sym('Eyler eyniliyi',
          'e^{i\\pi} + 1 = 0',
          'euler eyler identity'),
    ],
  },
]);

/**
 * Bütün düsturları tek listdə qaytarır (axtarış üçün).
 */
export const ALL_MATH_ITEMS = Object.freeze(
  MATH_CATEGORIES.flatMap((c) => c.items.map((it) => ({ ...it, categoryId: c.id })))
);
```

## `components/editor/parts/utils.js`

<sup>119 sətir</sup>

```js
/**
 * Editor üçün ümumi köməkçi funksiyalar.
 * Burada saxlanılan funksiyalar TipTap state-i ilə işləyir,
 * lakin React state saxlamır — sadəcə xalis hesablama / dispatch.
 */

/**
 * `style="key: value; ..."` sətrini { key: value } obyektinə çevirir.
 * Boş və ya səhv giriş üçün boş obyekt qaytarır.
 */
export function parseStyle(str) {
  if (!str || typeof str !== 'string') return {};
  return str.split(';').reduce((acc, part) => {
    const idx = part.indexOf(':');
    if (idx === -1) return acc;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k && v) acc[k] = v;
    return acc;
  }, {});
}

/**
 * { key: value } obyektini `key: value; ...` sətrinə çevirir.
 * Boş dəyərlər atılır.
 */
export function stringifyStyle(obj) {
  return Object.entries(obj || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

/**
 * Aktiv `image` node-unu tapır və onun `style` atributuna patch tətbiq edir.
 * Editor focus-unu oğurlamır — birbaşa transaction dispatch edir.
 *
 * @param {import('@tiptap/react').Editor} editor
 * @param {Record<string,string|null>} patch  - əlavə/dəyişiləcək style key-ləri.
 *        Dəyər `null` və ya `''` olarsa, həmin key style-dan silinir.
 */
export function updateImageStyle(editor, patch) {
  if (!editor) return;
  const { state } = editor;
  let imagePos = null;
  let imageNode = null;

  // Seçimdə (selection) və ya imleci əhatə edən image node-u taparıq.
  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
    if (node.type.name === 'image') {
      imagePos = pos;
      imageNode = node;
      return false;
    }
    return true;
  });

  if (imageNode == null) return;

  const current = parseStyle(imageNode.attrs.style || '');
  const next = { ...current, ...patch };
  // null/boş — silinsin
  Object.keys(patch).forEach((k) => {
    if (patch[k] == null || patch[k] === '') delete next[k];
  });

  const styleStr = stringifyStyle(next);
  const tr = state.tr.setNodeMarkup(imagePos, undefined, {
    ...imageNode.attrs,
    style: styleStr || null,
  });
  editor.view.dispatch(tr);
}

/**
 * Cari image node-unun parsed style obyektini qaytarır.
 */
export function getCurrentImageStyle(editor) {
  if (!editor) return {};
  const attrs = editor.getAttributes('image') || {};
  return parseStyle(attrs.style || '');
}

/**
 * Aktiv `image` node-una arbitrar atribut patch-i tətbiq edir
 * (məsələn `caption`).
 */
export function updateImageAttrs(editor, patch) {
  if (!editor) return;
  const { state } = editor;
  let imagePos = null;
  let imageNode = null;

  state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
    if (node.type.name === 'image') {
      imagePos = pos;
      imageNode = node;
      return false;
    }
    return true;
  });

  if (imageNode == null) return;

  const tr = state.tr.setNodeMarkup(imagePos, undefined, {
    ...imageNode.attrs,
    ...patch,
  });
  editor.view.dispatch(tr);
}

/**
 * Cari `image` node-unun arbitrar atributunu qaytarır (məsələn `caption`).
 */
export function getCurrentImageAttr(editor, key) {
  if (!editor) return '';
  const attrs = editor.getAttributes('image') || {};
  return attrs[key] || '';
}
```

## `components/editor/parts/ImageCollageExtension.js`

<sup>232 sətir</sup>

```js
'use client';

/* =====================================================================
 *  ImageCollage — 2/3/4 şəkili bir blokda göstərən node.
 *
 *  Atribut:
 *    - layout : '2' | '3-row' | '3-mosaic' | '4-grid' | '4-mosaic'
 *    - images : [{ src, alt }]
 *    - gap    : nömrə (px)
 *    - aspect : '16/9' | '4/3' | '1/1' | 'auto'
 *
 *  HTML çıxışı (parse də edə bilir):
 *    <div class="bdu-collage" data-layout="..." data-gap="..." data-aspect="..."
 *         style="--gap: 8px; --aspect: 4 / 3;">
 *      <figure><img src="..." alt="..." /></figure>
 *      ...
 *    </div>
 *
 *  Stillər `globals.css` daxilində `.bdu-collage[data-layout="..."]`
 *  selektorları ilə tətbiq olunur — beləliklə həm editorun ProseMirror
 *  görünüşündə, həm də public ArticleContent render-ində eyni nəticə
 *  alınır və CSS media query-lərlə responsiv olur.
 * ===================================================================== */

import { Node, mergeAttributes } from '@tiptap/core';

function parseImg(img, caption = '') {
  if (!img) return { src: '', alt: '', fit: 'cover', scale: 1, posX: 50, posY: 50, width: '', height: '', caption: '' };
  return {
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    fit: img.getAttribute('data-fit') || 'cover',
    scale: parseFloat(img.getAttribute('data-scale') || '1') || 1,
    posX: parseInt(img.getAttribute('data-pos-x') || '50', 10),
    posY: parseInt(img.getAttribute('data-pos-y') || '50', 10),
    width: img.getAttribute('data-img-w') || '',
    height: img.getAttribute('data-img-h') || '',
    caption: caption || img.getAttribute('data-caption') || '',
  };
}

export const COLLAGE_LAYOUTS = {
  '2':         { count: 2, label: '2 şəkil — yan-yana' },
  '3-row':     { count: 3, label: '3 şəkil — sıra' },
  '3-mosaic':  { count: 3, label: '3 şəkil — 1 böyük + 2 kiçik' },
  '4-row':     { count: 4, label: '4 şəkil — sıra' },
  '4-grid':    { count: 4, label: '4 şəkil — 2×2' },
  '4-mosaic':  { count: 4, label: '4 şəkil — 1 böyük + 3 kiçik' },
};

export const ImageCollage = Node.create({
  name: 'imageCollage',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      layout: {
        default: '2',
        parseHTML: (el) => el.getAttribute('data-layout') || '2',
        renderHTML: (attrs) => ({ 'data-layout': attrs.layout }),
      },
      gap: {
        default: 8,
        parseHTML: (el) => parseInt(el.getAttribute('data-gap') || '8', 10) || 8,
        renderHTML: (attrs) => ({ 'data-gap': String(attrs.gap ?? 8) }),
      },
      aspect: {
        default: '4/3',
        parseHTML: (el) => el.getAttribute('data-aspect') || '4/3',
        renderHTML: (attrs) => ({ 'data-aspect': attrs.aspect }),
      },
      width: {
        default: '100%',
        parseHTML: (el) => el.getAttribute('data-width') || '100%',
        renderHTML: (attrs) => ({ 'data-width': attrs.width || '100%' }),
      },
      height: {
        default: 'auto',
        parseHTML: (el) => el.getAttribute('data-height') || 'auto',
        renderHTML: (attrs) => ({ 'data-height': attrs.height || 'auto' }),
      },
      align: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs) => ({ 'data-align': attrs.align || 'center' }),
      },
      radius: {
        default: 8,
        parseHTML: (el) => parseInt(el.getAttribute('data-radius') || '8', 10) || 0,
        renderHTML: (attrs) => ({ 'data-radius': String(attrs.radius ?? 8) }),
      },
      images: {
        default: [],
        parseHTML: (el) => {
          const cells = Array.from(el.querySelectorAll('figure'));
          if (cells.length === 0) {
            // Köhnə HTML — birbaşa img-lər
            return Array.from(el.querySelectorAll('img')).map((img) => parseImg(img, ''));
          }
          return cells.map((fig) => {
            const img = fig.querySelector('img');
            const caption = fig.querySelector('figcaption')?.textContent || '';
            return parseImg(img, caption);
          });
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.bdu-collage' }, { tag: 'div[data-collage]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = Array.isArray(node.attrs.images) ? node.attrs.images : [];
    const gap = node.attrs.gap ?? 8;
    const aspect = node.attrs.aspect || '4/3';
    const width = node.attrs.width || '100%';
    const height = node.attrs.height || 'auto';
    const align = node.attrs.align || 'center';
    const radius = node.attrs.radius ?? 8;

    const useAspect = (!height || height === 'auto') && aspect && aspect !== 'auto';
    const margin = align === 'left' ? '0 auto 0 0'
      : align === 'right' ? '0 0 0 auto'
      : '0 auto';

    const styleParts = [
      `--bdu-collage-gap: ${gap}px`,
      `--bdu-collage-radius: ${radius}px`,
      useAspect ? `--bdu-collage-aspect: ${aspect.replace('/', ' / ')}` : '',
      `width: ${width}`,
      height && height !== 'auto' ? `height: ${height}` : '',
      `margin: ${margin}`,
    ].filter(Boolean);

    const figures = images.map((img, i) => {
      const fit = img?.fit || 'cover';
      const scale = Number(img?.scale) || 1;
      const posX = Number.isFinite(img?.posX) ? img.posX : 50;
      const posY = Number.isFinite(img?.posY) ? img.posY : 50;
      const imgW = (img?.width || '').toString().trim();
      const imgH = (img?.height || '').toString().trim();
      const caption = (img?.caption || '').toString().trim();
      const imgStyle = [
        `object-fit: ${fit}`,
        `object-position: ${posX}% ${posY}%`,
        scale !== 1 ? `transform: scale(${scale})` : '',
        scale !== 1 ? `transform-origin: ${posX}% ${posY}%` : '',
        imgW ? `width: ${imgW}` : '',
        imgH ? `height: ${imgH}` : '',
        imgW || imgH ? 'max-width: 100%; max-height: 100%' : '',
      ].filter(Boolean).join('; ');
      const cellChildren = [
        [
          'img',
          {
            src: img?.src || '',
            alt: img?.alt || '',
            loading: 'lazy',
            draggable: 'false',
            'data-fit': fit,
            'data-scale': String(scale),
            'data-pos-x': String(posX),
            'data-pos-y': String(posY),
            'data-img-w': imgW,
            'data-img-h': imgH,
            style: imgStyle,
          },
        ],
      ];
      if (caption) {
        cellChildren.push(['figcaption', { class: 'bdu-collage__caption' }, caption]);
      }
      return [
        'figure',
        { class: 'bdu-collage__cell', 'data-cell': String(i) },
        ...cellChildren,
      ];
    });

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'bdu-collage',
        'data-collage': '1',
        style: styleParts.join('; '),
      }),
      ...figures,
    ];
  },

  addCommands() {
    return {
      insertImageCollage:
        ({ layout = '2', images = [], gap = 8, aspect = '4/3', width = '100%', height = 'auto', align = 'center', radius = 8 } = {}) =>
        ({ chain }) => {
          const def = COLLAGE_LAYOUTS[layout];
          const max = def?.count || 2;
          const safeImages = images
            .filter((i) => i && i.src)
            .slice(0, max)
            .map((i) => ({
              src: i.src,
              alt: i.alt || '',
              fit: i.fit || 'cover',
              scale: Number(i.scale) || 1,
              posX: Number.isFinite(i.posX) ? i.posX : 50,
              posY: Number.isFinite(i.posY) ? i.posY : 50,
              width: (i.width || '').toString(),
              height: (i.height || '').toString(),
              caption: (i.caption || '').toString(),
            }));
          if (safeImages.length === 0) return false;
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { layout, images: safeImages, gap, aspect, width, height, align, radius },
            })
            .createParagraphNear()
            .run();
        },
    };
  },
});

export default ImageCollage;
```

## `components/editor/parts/ImageSliderExtension.js`

<sup>203 sətir</sup>

```js
'use client';

/* =====================================================================
 *  ImageSlider — responsiv şəkil sürüşdürücüsü (carousel) node-u.
 *
 *  Atributlar:
 *    - images        : [{ src, alt, caption }]
 *    - autoplay      : boolean
 *    - autoplayDelay : ms
 *    - loop          : boolean
 *    - navigation    : boolean (sol/sağ ox)
 *    - pagination    : boolean (nöqtələr)
 *    - slidesPerView : 1 | 2 | 3 | 4
 *    - gap           : px
 *    - height        : '320px' | '50vh' | 'auto'
 *    - radius        : px
 *
 *  HTML çıxışı public ArticleContent-də Embla ilə canlı bağlanır
 *  (data-slider="1" atributu marker rolunu oynayır).
 * ===================================================================== */

import { Node, mergeAttributes } from '@tiptap/core';

export const SLIDER_DEFAULTS = {
  autoplay: false,
  autoplayDelay: 4000,
  loop: true,
  navigation: true,
  pagination: true,
  slidesPerView: 1,
  gap: 12,
  height: '360px',
  radius: 8,
};

function parseSlide(figEl) {
  const img = figEl?.querySelector?.('img');
  const caption = figEl?.querySelector?.('figcaption')?.textContent || '';
  return {
    src: img?.getAttribute('src') || '',
    alt: img?.getAttribute('alt') || '',
    caption: caption || '',
  };
}

export const ImageSlider = Node.create({
  name: 'imageSlider',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (el) => {
          const figs = Array.from(el.querySelectorAll('figure.bdu-slider__slide'));
          if (figs.length) return figs.map(parseSlide);
          return Array.from(el.querySelectorAll('img')).map((img) => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '',
            caption: '',
          }));
        },
        renderHTML: () => ({}),
      },
      autoplay: {
        default: SLIDER_DEFAULTS.autoplay,
        parseHTML: (el) => el.getAttribute('data-autoplay') === '1',
        renderHTML: (a) => ({ 'data-autoplay': a.autoplay ? '1' : '0' }),
      },
      autoplayDelay: {
        default: SLIDER_DEFAULTS.autoplayDelay,
        parseHTML: (el) => parseInt(el.getAttribute('data-autoplay-delay') || '4000', 10) || 4000,
        renderHTML: (a) => ({ 'data-autoplay-delay': String(a.autoplayDelay ?? 4000) }),
      },
      loop: {
        default: SLIDER_DEFAULTS.loop,
        parseHTML: (el) => el.getAttribute('data-loop') !== '0',
        renderHTML: (a) => ({ 'data-loop': a.loop ? '1' : '0' }),
      },
      navigation: {
        default: SLIDER_DEFAULTS.navigation,
        parseHTML: (el) => el.getAttribute('data-nav') !== '0',
        renderHTML: (a) => ({ 'data-nav': a.navigation ? '1' : '0' }),
      },
      pagination: {
        default: SLIDER_DEFAULTS.pagination,
        parseHTML: (el) => el.getAttribute('data-pagination') !== '0',
        renderHTML: (a) => ({ 'data-pagination': a.pagination ? '1' : '0' }),
      },
      slidesPerView: {
        default: SLIDER_DEFAULTS.slidesPerView,
        parseHTML: (el) => parseInt(el.getAttribute('data-spv') || '1', 10) || 1,
        renderHTML: (a) => ({ 'data-spv': String(a.slidesPerView ?? 1) }),
      },
      gap: {
        default: SLIDER_DEFAULTS.gap,
        parseHTML: (el) => parseInt(el.getAttribute('data-gap') || '12', 10) || 12,
        renderHTML: (a) => ({ 'data-gap': String(a.gap ?? 12) }),
      },
      height: {
        default: SLIDER_DEFAULTS.height,
        parseHTML: (el) => el.getAttribute('data-height') || '360px',
        renderHTML: (a) => ({ 'data-height': a.height || '360px' }),
      },
      radius: {
        default: SLIDER_DEFAULTS.radius,
        parseHTML: (el) => parseInt(el.getAttribute('data-radius') || '8', 10) || 0,
        renderHTML: (a) => ({ 'data-radius': String(a.radius ?? 8) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.bdu-slider' }, { tag: 'div[data-slider]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = Array.isArray(node.attrs.images) ? node.attrs.images : [];
    const height = node.attrs.height || '360px';
    const gap = node.attrs.gap ?? 12;
    const radius = node.attrs.radius ?? 8;
    const spv = node.attrs.slidesPerView || 1;

    const styleParts = [
      `--bdu-slider-gap: ${gap}px`,
      `--bdu-slider-radius: ${radius}px`,
      `--bdu-slider-spv: ${spv}`,
      height && height !== 'auto' ? `height: ${height}` : '',
    ].filter(Boolean);

    const slides = images
      .filter((s) => s && s.src)
      .map((s) => {
        const children = [
          [
            'img',
            {
              src: s.src,
              alt: s.alt || '',
              loading: 'lazy',
              draggable: 'false',
            },
          ],
        ];
        if (s.caption) {
          children.push([
            'figcaption',
            { class: 'bdu-slider__caption' },
            s.caption,
          ]);
        }
        return ['figure', { class: 'bdu-slider__slide' }, ...children];
      });

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'bdu-slider',
        'data-slider': '1',
        style: styleParts.join('; '),
      }),
      ['div', { class: 'bdu-slider__viewport' }, ['div', { class: 'bdu-slider__track' }, ...slides]],
    ];
  },

  addCommands() {
    return {
      insertImageSlider:
        (opts = {}) =>
        ({ chain }) => {
          const safeImages = (opts.images || [])
            .filter((s) => s && s.src)
            .map((s) => ({
              src: s.src,
              alt: s.alt || '',
              caption: (s.caption || '').toString(),
            }));
          if (safeImages.length === 0) return false;
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: {
                ...SLIDER_DEFAULTS,
                ...opts,
                images: safeImages,
              },
            })
            .createParagraphNear()
            .run();
        },
      updateImageSlider:
        (attrs = {}) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, attrs),
    };
  },
});

export default ImageSlider;
```
