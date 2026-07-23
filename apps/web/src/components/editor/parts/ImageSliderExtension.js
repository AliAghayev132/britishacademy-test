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
