import DOMPurify from "isomorphic-dompurify";

/**
 * Backend-dən gələn (admin redaktoru ilə yazılmış) HTML-i render etməzdən əvvəl
 * təhlükəsizləşdirir — `<script>`, `on*` event handler-ləri, `javascript:` URI-ləri
 * və digər XSS vektorlarını silir. Bu, defense-in-depth-dir: məzmun etibarlı
 * adminlər tərəfindən yazılsa da, ələ keçirilmiş hesab və ya keçmiş data
 * saxlanmış zərərli HTML-in brauzerdə icra olunmasının qarşısını alır.
 *
 * Legitim rich content (YouTube iframe, cədvəl, şəkil, KaTeX riyaziyyatı, figure)
 * qorunur. SSR-də də işləyir (isomorphic-dompurify server tərəfdə jsdom istifadə edir).
 */
const CONFIG = {
  // Tiptap YouTube extension `<iframe>` render edir — icazə veririk (src sxemi
  // DOMPurify tərəfindən yoxlanır: javascript: və s. bloklanır). Host isə
  // aşağıdakı hook ilə whitelist-ə məhdudlaşdırılır.
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "scrolling",
    "target",
    "referrerpolicy",
  ],
};

// Bug #3: DOMPurify yalnız URI sxemini yoxlayır, host-u yox. `<iframe>`-in
// yalnız etibarlı video hostlarına icazə ver ki, ələ keçirilmiş admin ixtiyari
// domendən iframe yerləşdirə bilməsin (clickjacking/phishing). Əlavə host
// lazımdırsa bu siyahıya əlavə et.
const ALLOWED_IFRAME_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
]);

let hookRegistered = false;
function ensureIframeHostHook() {
  if (hookRegistered) return;
  hookRegistered = true;
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName !== "iframe") return;
    const src = node.getAttribute?.("src") || "";
    let host = "";
    try {
      host = new URL(src, "https://invalid.local").hostname;
    } catch {
      host = "";
    }
    if (!ALLOWED_IFRAME_HOSTS.has(host)) {
      node.parentNode?.removeChild(node);
    }
  });
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  ensureIframeHostHook();
  return DOMPurify.sanitize(html, CONFIG);
}

export default sanitizeHtml;
