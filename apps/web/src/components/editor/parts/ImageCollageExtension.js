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
