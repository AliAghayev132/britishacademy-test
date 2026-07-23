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
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import ImageBase from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { MathBlock, MathInline } from '../MathExtension';
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
/*  TextStyle genişləndirilməsi — fontSize, fontFamily inline mark    */
/* ------------------------------------------------------------------ */
export const StyledTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el) => el.style?.fontSize?.replace(/['"]+/g, '') || null,
        renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
      },
      fontFamily: {
        default: null,
        parseHTML: (el) => el.style?.fontFamily?.replace(/['"]+/g, '') || null,
        renderHTML: (attrs) => (attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {}),
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
      setFontFamily:
        (family) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: family }).run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run(),
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
    StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
    Underline,
    Subscript,
    Superscript,
    StyledTextStyle,
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

    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
      },
    }),
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
    MathBlock,
    MathInline,
    maxCharacters
      ? CharacterCount.configure({ limit: maxCharacters })
      : CharacterCount,
  ];
}
