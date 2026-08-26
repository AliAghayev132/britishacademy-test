# Köməkçilər (layihədən asılı)

Editor layihədən **yalnız iki şey** alır — hər ikisi asanlıqla əvəzlənir.
Aşağıdakı fayllar həmin funksiyaların bu layihədəki variantıdır.

## `utils/sanitizeHtml.js`

Önizləmədə və public render-də XSS qorunması. `isomorphic-dompurify` tələb edir.

<sup>65 sətir</sup>

```js
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
```

## `utils/normalizeContentHtml.js`

Saxlanmış HTML-i render etməzdən əvvəl normallaşdırır (köhnə host prefiksləri və s.).

<sup>38 sətir</sup>

```js
/**
 * TipTap (admin redaktoru) ilə yazılmış HTML-də saxlanmış köhnə (legacy)
 * media URL-lərini cari host-a uyğun hala gətirir.
 *
 * Konkret olaraq:
 *  - `<img src>`, `<source src>`, `<video src>`, `<a href>`, `srcset` və
 *    inline `style="background-image:url(...)"` daxilində legacy host
 *    (məs. `http://109.205.178.176:3001`) tapılırsa silinir → nisbi yola
 *    çevrilir (`/public/uploads/...`).
 *  - Brauzer onu cari domen (məs. `bdu.co.az`) altında həll edir, nginx isə
 *    `/public/...` yolunu backend-ə proksi edir.
 *
 * SSR-də də işləyir (yalnız sətir əməliyyatları, DOM lazım deyil).
 */

import { LEGACY_IMAGE_HOSTS } from "@/utils/legacyHosts";

let cachedRegex = null;

function getLegacyRegex() {
  if (cachedRegex) return cachedRegex;
  const escaped = LEGACY_IMAGE_HOSTS.map((h) =>
    h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  // Slash, dırnaq və ya mötərizə ilə bitənə qədər host-u tutur.
  cachedRegex = new RegExp(`(${escaped.join("|")})(?=/|"|'|\\)|\\s|$)`, "g");
  return cachedRegex;
}

/**
 * @param {string} html
 * @returns {string}
 */
export function normalizeContentHtml(html) {
  if (!html || typeof html !== "string") return html || "";
  if (LEGACY_IMAGE_HOSTS.length === 0) return html;
  return html.replace(getLegacyRegex(), "");
}
```

## `utils/uploadWithProgress.js`

XHR ilə faiz göstəricili yükləmə — `onImageUpload` prop-unun nümunə tətbiqi.

<sup>126 sətir</sup>

```js
'use client';

/* =====================================================================
 *  uploadWithProgress — XHR-based file upload with real progress.
 *
 *  fetch() does not expose upload progress, so we use XHR when sending
 *  FormData. On a 401 we refresh the access token once (mirroring the RTK
 *  base query reauth flow) and retry.
 *
 *  Auth source of truth: localStorage['auth'] =
 *    { user, accessToken, refreshToken, role }
 *
 *  Usage:
 *    const data = await uploadWithProgress(url, formData, (pct) => ...);
 *    // data — the server JSON response
 * ===================================================================== */

import { API_URL } from '@/lib/variables';

const STORAGE_KEY = 'auth';

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

function clearStoredAuthAndRedirect() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
  window.location.href = '/login';
}

/**
 * Refresh the access token using the stored refresh token.
 * Returns the new tokens object `{ accessToken, refreshToken }` or null.
 */
async function refreshTokens() {
  const stored = readStoredAuth();
  const refreshToken = stored?.refreshToken;
  if (!refreshToken) return null;

  const r = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  const body = await r.json().catch(() => null);
  if (!r.ok || !body?.success || !body?.data?.tokens) return null;

  const tokens = body.data.tokens;
  writeStoredAuth({ ...stored, ...tokens });
  return tokens;
}

function xhrUpload(url, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && typeof onProgress === 'function') {
        onProgress((evt.loaded / evt.total) * 100);
      }
    };

    xhr.onload = () => {
      let body;
      try { body = JSON.parse(xhr.responseText); } catch { body = null; }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(formData);
  });
}

/**
 * @param {string} url      Full URL
 * @param {FormData} formData
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<any>}  Server JSON body
 */
export async function uploadWithProgress(url, formData, onProgress) {
  if (typeof window === 'undefined') {
    throw new Error('uploadWithProgress can only be used in the browser');
  }

  let token = readStoredAuth()?.accessToken;
  let { status, body } = await xhrUpload(url, formData, token, onProgress);

  if (status === 401) {
    // Access token expired — refresh and retry once.
    const tokens = await refreshTokens();
    if (tokens?.accessToken) {
      token = tokens.accessToken;
      ({ status, body } = await xhrUpload(url, formData, token, onProgress));
    } else {
      clearStoredAuthAndRedirect();
      throw new Error('Session expired');
    }
  }

  if (status < 200 || status >= 300) {
    throw new Error(body?.message || `Upload failed (HTTP ${status})`);
  }
  return body;
}
```

## `utils/uploadDocumentForEditor.js`

<sup>36 sətir</sup>

```js
'use client';

// Local
import { uploadWithProgress } from './uploadWithProgress';
import { getImageUrl } from './getImageUrl';

// Utils
import { API_URL } from '@/lib/variables';

/**
 * Upload a document (PDF, Word, Excel, etc.) for the Tiptap editor.
 * @param {File} file
 * @param {string|null} customName  Display name shown in the editor (no extension).
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<{url:string,name:string,size:number,mimetype:string}>}
 */
export async function uploadDocumentForEditor(file, customName, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  if (customName) formData.append('name', String(customName));

  const result = await uploadWithProgress(
    `${API_URL}/media/upload-document`,
    formData,
    onProgress,
  );

  if (!result?.success) {
    throw new Error(result?.message || 'Document upload failed');
  }

  return {
    ...result.data,
    url: getImageUrl(result.data.url),
  };
}
```

## `utils/getImageUrl.js`

<sup>117 sətir</sup>

```js
/**
 * Image URL Utility
 * Backend şəkil URL-lərini düzgün formatda almaq üçün
 */

import { IMAGE_URL as API_URL } from "@/lib/variables";
import { stripLegacyHost } from "@/utils/legacyHosts";

/**
 * Şəkil URL-ini düzgün formatda al
 * Backend-dən gələn path-i tam URL-ə çevirir
 *
 * @param {string|object} imagePath - Şəkil path-i (string və ya Next.js image object)
 * @returns {string|null} - Tam şəkil URL-i
 *
 * @example
 * // Backend path
 * getImageUrl('/public/uploads/news/image.jpg')
 * // Returns: 'http://localhost:3001/public/uploads/news/image.jpg'
 *
 * @example
 * // Full URL (olduğu kimi qaytarır)
 * getImageUrl('https://example.com/image.jpg')
 * // Returns: 'https://example.com/image.jpg'
 *
 * @example
 * // Next.js static import
 * getImageUrl(newsImage) // newsImage = import from '@/assets/images/...'
 * // Returns: newsImage (object)
 */
export function getImageUrl(imagePath) {
  // Null/undefined check
  if (!imagePath) return null;

  // Next.js static import (object with src property)
  if (typeof imagePath === "object" && imagePath.src) {
    return imagePath;
  }

  // String olmayan hallar
  if (typeof imagePath !== "string") return null;

  // Köhnə (legacy) host (məs. server IP-si) ilə başlayırsa, prefiksi sil ki,
  // yenidən cari `IMAGE_URL`-ə bağlana bilsin.
  const stripped = stripLegacyHost(imagePath);

  // Artıq tam URL-dirsə, olduğu kimi qaytar
  if (stripped.startsWith("http://") || stripped.startsWith("https://")) {
    return stripped;
  }

  // Data URL (base64)
  if (stripped.startsWith("data:")) {
    return stripped;
  }

  // Relative path - API URL əlavə et
  // Path "/" ilə başlayırsa, birbaşa əlavə et
  // Əks halda "/" əlavə et
  const cleanPath = stripped.startsWith("/") ? stripped : `/${stripped}`;

  // API_URL sonunda "/" varsa, çıxar
  const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  return `${baseUrl}${cleanPath}`;
}

/**
 * Şəkil URL-inin valid olub-olmadığını yoxla
 *
 * @param {string} url - Şəkil URL-i
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url) return false;

  // Object (Next.js static import)
  if (typeof url === "object" && url.src) return true;

  if (typeof url !== "string") return false;

  // URL formatını yoxla
  try {
    new URL(url);
    return true;
  } catch {
    // Relative path olduqda da valid sayılır
    return url.startsWith("/") || url.startsWith("public/");
  }
}

/**
 * Placeholder şəkil URL-i
 * Şəkil olmadıqda istifadə üçün
 */
export const PLACEHOLDER_IMAGE = "/placeholder-image.jpg";

/**
 * Default news cover image
 */
export const DEFAULT_NEWS_IMAGE = "/images/default-news.jpg";

/**
 * getImageUrl with fallback
 * Şəkil yoxdursa, fallback göstər
 *
 * @param {string} imagePath
 * @param {string} fallback - Default: PLACEHOLDER_IMAGE
 * @returns {string}
 */
export function getImageUrlWithFallback(
  imagePath,
  fallback = PLACEHOLDER_IMAGE
) {
  const url = getImageUrl(imagePath);
  return url || fallback;
}
```

## `utils/getOriginalImageUrl.js`

<sup>24 sətir</sup>

```js
/**
 * Verilmiş şəkil URL-ini orijinal (optimallaşdırılmamış) versiyaya çevirir.
 *   /public/uploads/news/123-foo.jpg  →  /public/uploads/originals/news/123-foo.jpg
 *   https://api.../public/uploads/news/123-foo.jpg → ...originals/news/123-foo.jpg
 *
 * Sayt daxili olmayan (xarici) və ya yerli `/images/...` faylları üçün eyni URL qaytarılır,
 * çünki onlar üçün orijinal mövcud deyil.
 */
export function getOriginalImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("/uploads/originals/")) return url;
  if (url.includes("/uploads/")) {
    return url.replace(/\/uploads\//, "/uploads/originals/");
  }
  return url;
}

/**
 * Verilmiş URL-in orijinal nüsxəsi (sayt server-of-truth uploads-da yerləşən fayllar) ola
 * biləcəyini yoxlayır. Yalnız `/uploads/...` altındakı fayllar üçün true qaytarır.
 */
export function hasOriginalVariant(url) {
  return typeof url === "string" && /\/uploads\//.test(url);
}
```

## `utils/legacyHosts.js`

<sup>44 sətir</sup>

```js
/**
 * Köhnə (legacy) media host-larının siyahısı.
 *
 * DB-də saxlanan TipTap HTML və müəyyən image field-lərində hələ də əvvəlki
 * server IP-si və ya köhnə domen ilə tam URL-lər ola bilər. Render zamanı
 * bu prefiksləri silərək nisbi (relative) yola çeviririk — beləliklə
 * cari `NEXT_PUBLIC_IMAGE_URL` (və ya brauzerin cari origin-i) avtomatik
 * tətbiq olunur.
 *
 * Əlavə host lazım olarsa `NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` env-ə vergüllə
 * ayrılmış şəkildə əlavə et:
 *   NEXT_PUBLIC_LEGACY_IMAGE_HOSTS=http://example.com,https://old.bdu.az
 */

// Bug #4: proyektə-xas hardcoded IP-lər buradan çıxarıldı. Köhnə data-nız
// mütləq URL saxlayırsa, onları `NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` (Next) və ya
// `VITE_LEGACY_IMAGE_HOSTS` (Vite) env ilə vergüllə ayrılmış şəkildə ver.
// Boş qaldıqda `normalizeContentHtml` sadəcə no-op olur.
const DEFAULT_LEGACY_HOSTS = [];

const envHosts = (process.env.NEXT_PUBLIC_LEGACY_IMAGE_HOSTS || "")
  .split(",")
  .map((h) => h.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const LEGACY_IMAGE_HOSTS = Array.from(
  new Set([...DEFAULT_LEGACY_HOSTS, ...envHosts]),
);

/**
 * Verilmiş URL legacy host-lardan biri ilə başlayırsa, host hissəsini silib
 * yerinə nisbi yol qaytarır. Əks halda dəyişmədən qaytarır.
 *
 * @param {string} url
 * @returns {string}
 */
export function stripLegacyHost(url) {
  if (!url || typeof url !== "string") return url;
  for (const host of LEGACY_IMAGE_HOSTS) {
    if (url.startsWith(host + "/")) return url.slice(host.length);
    if (url === host) return "/";
  }
  return url;
}
```
