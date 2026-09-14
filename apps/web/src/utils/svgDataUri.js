/**
 * Inline SVG mətni → `<img src>` üçün data URI.
 *
 * Bayraqlar admin sahəsində SVG mətni kimi saxlanılır. `dangerouslySetInnerHTML`
 * ilə göstərmək sanitizasiya tələb edirdi və DOMPurify-ı (isomorphic-dompurify)
 * ictimai saytın client bundle-ına salırdı. `<img>` kimi yüklənən SVG-də skript
 * və hadisə atributları İCRA OLUNMUR — brauzer onu şəkil kimi işləyir, ona görə
 * sanitizasiya lazım deyil.
 */
export function svgDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(svg || "").trim())}`;
}

/** Mətn inline SVG-dirmi? */
export const isInlineSvg = (value) => /^\s*<svg[\s>]/i.test(String(value || ""));
