// Editor
import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Video — yüklənən faylların (mp4/webm) redaktor node-u.
 *
 * ── NİYƏ LAZIM OLDU ──
 * `VideoMenu` videonu hazır HTML kimi yerləşdirirdi:
 *   <div data-video-wrapper="true"><video controls src="…"></video></div>
 * Sxemdə `video` node-u YOX idi (yalnız YouTube uzantısı vardı), ona görə
 * ProseMirror bu HTML-i tanımırdı və redaktorda onu VİDEO kimi yox, düz
 * MƏTN kimi göstərirdi — admin oynadıla bilməyən teq yığını görürdü.
 * (İctimai saytda problem yox idi: `sanitizeHtml` <video>-nu buraxır və
 * `editor-content.css`-də üslubları da hazır idi.)
 *
 * `atom` — vahid blokdur, içinə mətn yazılmır. `contenteditable=false`
 * olmadan brauzer idarə düymələrini (play, səs, tam ekran) redaktə sahəsinin
 * bir hissəsi sayır və kliklər node seçiminə düşür, video oynamır.
 */
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
    };
  },

  parseHTML() {
    // Sadəcə `video` teqi tutulur: sarğı div-i tanınmasa da ProseMirror onu
    // atır, içəridəki video isə bu qaydaya düşür. Beləcə BAZADA artıq yazılmış
    // köhnə məzmun da düzgün açılır.
    return [
      {
        tag: 'video',
        getAttrs: (el) => ({
          src: el.getAttribute('src'),
          poster: el.getAttribute('poster'),
        }),
      },
    ];
  },

  // Yadda saxlanan HTML — ictimai sayt bunu oxuyur. Redaktora aid atribut
  // (`contenteditable`) BURADA YOXDUR: o, bazaya yazılmamalıdır.
  renderHTML({ HTMLAttributes }) {
    const { src, poster } = HTMLAttributes;
    return [
      'div',
      { 'data-video-wrapper': 'true' },
      [
        'video',
        mergeAttributes(
          { controls: 'true', preload: 'metadata', playsinline: 'true' },
          src ? { src } : {},
          poster ? { poster } : {},
          { style: 'max-width:100%; height:auto;' },
        ),
      ],
    ];
  },

  // Redaktordakı görünüş. `contenteditable=false` yalnız burada: onsuz brauzer
  // idarə düymələrini (play, səs, tam ekran) redaktə sahəsinin hissəsi sayır,
  // kliklər node seçiminə düşür və video oynamır.
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-video-wrapper', 'true');
      dom.contentEditable = 'false';
      const video = document.createElement('video');
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      if (node.attrs.src) video.src = node.attrs.src;
      if (node.attrs.poster) video.poster = node.attrs.poster;
      video.style.cssText = 'max-width:100%; height:auto;';
      dom.appendChild(video);
      return { dom };
    };
  },

  addCommands() {
    return {
      /** Videonu node kimi yerləşdir (xam HTML-dən etibarlıdır). */
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
