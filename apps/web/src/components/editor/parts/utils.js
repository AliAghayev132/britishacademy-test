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
