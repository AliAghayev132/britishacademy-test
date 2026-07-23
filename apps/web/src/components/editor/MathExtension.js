import { Node, mergeAttributes } from '@tiptap/core';
import katex from 'katex';

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        // We serialize the formula ONLY as a `data-latex` attribute (below) and
        // let the public renderer draw KaTeX from it. `rendered: false` stops
        // Tiptap from also emitting a stray `latex="…"` attribute.
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-math-block]',
        getAttrs: (dom) => ({
          latex: dom.getAttribute('data-latex') || '',
        }),
      },
    ];
  },

  // IMPORTANT (bug #1): getHTML() must NOT embed pre-rendered KaTeX. Array-form
  // renderHTML turns `{ innerHTML }` into an attribute (not content) and inline
  // strings get escaped, so the stored HTML would render broken on the public
  // site. Instead we persist only `data-latex` + an empty render target; the
  // public renderer (ArticleContent) calls katex.render() from `data-latex`.
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-math-block': '',
        'data-latex': HTMLAttributes.latex ?? '',
        class: 'math-block-wrapper',
      }),
      ['div', { class: 'math-block-render' }],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('math-block-wrapper');
      dom.setAttribute('data-math-block', '');
      dom.setAttribute('data-latex', node.attrs.latex);

      const renderEl = document.createElement('div');
      renderEl.classList.add('math-block-render');

      try {
        katex.render(node.attrs.latex || '\\text{Click to edit formula}', renderEl, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        renderEl.textContent = node.attrs.latex || 'Empty formula';
      }

      dom.appendChild(renderEl);

      dom.addEventListener('dblclick', () => {
        if (!editor.isEditable) return;
        const newLatex = prompt('LaTeX düsturu daxil edin:', node.attrs.latex);
        if (newLatex !== null) {
          const pos = getPos();
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeAttribute(pos, 'latex', newLatex);
            return true;
          }).run();
        }
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'mathBlock') return false;
          dom.setAttribute('data-latex', updatedNode.attrs.latex);
          try {
            katex.render(updatedNode.attrs.latex || '\\text{Click to edit}', renderEl, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            renderEl.textContent = updatedNode.attrs.latex;
          }
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertMathBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        // See MathBlock: persist as `data-latex` only, no stray `latex` attr.
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-math-inline]',
        getAttrs: (dom) => ({
          latex: dom.getAttribute('data-latex') || '',
        }),
      },
    ];
  },

  // IMPORTANT (bug #1): store only `data-latex`; the public renderer draws the
  // inline KaTeX from it. Never serialize the rendered KaTeX string here (it was
  // being escaped into visible text).
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-math-inline': '',
        'data-latex': HTMLAttributes.latex ?? '',
        class: 'math-inline-wrapper',
      }),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.classList.add('math-inline-wrapper');
      dom.setAttribute('data-math-inline', '');

      try {
        katex.render(node.attrs.latex || 'x', dom, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        dom.textContent = node.attrs.latex;
      }

      dom.addEventListener('dblclick', () => {
        if (!editor.isEditable) return;
        const newLatex = prompt('LaTeX düsturu daxil edin:', node.attrs.latex);
        if (newLatex !== null) {
          const pos = getPos();
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeAttribute(pos, 'latex', newLatex);
            return true;
          }).run();
        }
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'mathInline') return false;
          try {
            katex.render(updatedNode.attrs.latex || 'x', dom, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            dom.textContent = updatedNode.attrs.latex;
          }
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertMathInline:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
