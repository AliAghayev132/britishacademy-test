# 10 — TipTap Zəngin Mətn Redaktoru (Blog/Məqalə sistemi)

Bu sənəd `fullstack-starter` şablonuna inteqrasiya edilmiş **TipTap əsaslı zəngin mətn
redaktoru** sistemini izah edir. Sistem BDU layihəsindən çıxarılmış `tiptap-export`
modulundan gəlir, bugları düzəldilib və hər üç şablona (server, client-react,
client-next) generic formada uyğunlaşdırılıb.

Redaktor mövcud **`Post`** resursu üzərində işləyir: yazılan HTML `Post.content`
sahəsində saxlanır və public tərəfdə eyni HTML render olunur.

---

## 1. Memarlıq — üç tərəf

```
  YAZMA (admin)                 SAXLAMA (backend)              GÖSTƏRMƏ (public)
  TiptapEditor.jsx   ──HTML──▶  POST/PUT /api/posts   ──────▶  ArticleContent.jsx
  editor.getHTML()              Post.content: "<h2>…"          GET /api/posts/slug/:slug
```

- Redaktor məzmunu **HTML string** kimi qaytarır (`onChange(editor.getHTML())`).
- HTML olduğu kimi `Post.content`-də saxlanır (RTK Query `createPost`/`updatePost`).
- Public səhifə həmin HTML-i `ArticleContent` ilə render edir (`getPostBySlug`).
- **Kritik:** eyni `editor-content.css` həm admin redaktor səhifəsində, həm də public
  render səhifəsində import olunmalıdır ki, görünüş üst-üstə düşsün.

### İmkanlar
Başlıqlar, siyahılar, sitat, kod, **font/rəng/highlight**, cədvəl (Word/Excel vari xana
formatı), şəkil (figure + caption), **şəkil kollajı** (2/3/4), **şəkil slayderi** (Embla),
YouTube, video, sənəd yükləmə (PDF/Word/Excel), **KaTeX riyaziyyatı** (block + inline),
tam ekran, önizləmə, statistika, və opsional **AI köməkçi** (tərcümə/polish/slug/keywords/
excerpt/SEO).

---

## 2. Düzəldilmiş buglar (mənbə: `tiptap-export/BUGS.md`)

Şablona köçürülməzdən əvvəl mənbədə düzəldilən problemlər:

| # | Problem | Həll |
|---|---------|------|
| 1 🔴 | KaTeX `getHTML()`-də sınıq serializasiya olunurdu (public-də boş/escaped düstur) | `renderHTML` yalnız `data-latex` saxlayır; public renderer (`ArticleContent`) KaTeX-i ondan çəkir. `latex` atributu `rendered:false` |
| 2 🟠 | `FileService.deleteFile` Windows-da `\` səbəbindən bütün silmələri bloklayırdı | `path.normalize`-dən sonra `\`→`/` normallaşdırma |
| 3 🟠 | `sanitizeHtml` istənilən host-dan `<iframe>`-ə icazə verirdi | DOMPurify `uponSanitizeElement` hook ilə iframe `src` yalnız youtube/vimeo host-larına |
| 4 🟠 | `legacyHosts` proyektə-xas IP-ləri hardcoded saxlayırdı | Default boş; `VITE_/NEXT_PUBLIC_LEGACY_IMAGE_HOSTS` env |
| 5 🟡 | Redaktor önizləməsi sanitizasiya olunmurdu | Önizləmə də `sanitizeHtml`-dən keçir |
| 8 🟡 | `setContent(content, false)` — Tiptap v3 API dəyişikliyi | `setContent(content, { emitUpdate: false })` |

`#6` (math `prompt` UX) və `#9` (iki MutationObserver perf qeydi) qəsdən saxlanılıb —
funksional bug deyil. `#7` (upload limit uyğunsuzluğu) server inteqrasiyasında per-route
`uploadLimit` middleware ilə həll olunub.

---

## 3. Server tərəfi (`server/`)

### Konfiqurasiya (`config/config.js`)
- `config.upload` — `maxImageSize` (30MB), `maxVideoSize` (100MB), `maxDocSize` (100MB),
  `allowedImageTypes` / `allowedVideoTypes` / `allowedDocTypes`.
- `config.ai` — `{ apiKey: OPENROUTER_API_KEY, model: OPENROUTER_MODEL }`.

### `services/FileService.js`
Mövcud metodlara əlavə olunub:
- `uploadImage(file, folder="content")` → `/uploads/content/<file>` qaytarır, paralel
  `uploads/originals/content/` nüsxəsi saxlayır (public "orijinalı endir" düyməsi üçün).
- `uploadVideo(file, folder="videos")`, `uploadDocument(file, folder="documents", name)`.
- Hamısı path-traversal qorunması + crypto-hex ad ilə template konvensiyasını izləyir.

### Endpoint-lər
| Method | Route | Auth | Nə edir |
|--------|-------|------|---------|
| POST | `/api/media/upload-image` | ✅ | Şəkil yüklə (field `image`) → `{ data:{ url } }` |
| POST | `/api/media/upload-video` | ✅ | Video yüklə (field `video`) |
| POST | `/api/media/upload-document` | ✅ | Sənəd yüklə (field `file`, opsional `name`) |
| POST | `/api/ai/process` | ✅ | AI əməliyyatı (`OPENROUTER_API_KEY` yoxdursa **503**) |
| GET | `/api/posts/slug/:slug` | ⬜ | Public render üçün slug ilə post (`/:id`-dən əvvəl mount olunub) |

- `controllers/mediaController.js`, `controllers/aiController.js` (`export * as`), 
  `routes/mediaRoutes.js`, `routes/aiRoutes.js`, `app.js`-də `/api/media` + `/api/ai` mount.
- `middlewares/upload.js` → `uploadLimit(maxBytes)` per-route limit (413) — global
  `express-fileupload` limiti `maxVideoSize`-a qaldırılıb ki, per-route guard işə düşə bilsin.
- AI **opsionaldır**: `OPENROUTER_API_KEY` təyin olunmasa redaktor tam işləyir, yalnız
  `/api/ai/process` 503 qaytarır.

### Env (`server/.env.example`)
```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

---

## 4. Client tərəfi (client-react + client-next)

Hər iki client eyni modulu paylaşır; yalnız env prefiksi və routing fərqlidir.

### Köçürülən modul (`src/`)
- `components/editor/` — TipTap redaktoru (bütöv, self-contained): `TiptapEditor.jsx`,
  `MathExtension.js`, `parts/*` (toolbar, kollaj, slayder, cədvəl, math, video, file...).
- `components/ArticleContent.jsx` — public renderer (KaTeX + Embla slayder + "orijinalı endir").
- `components/ai/components/*`, `hooks/useAI.js`, `hooks/useAIHandlers.js` — AI köməkçi.
- `utils/*` — `sanitizeHtml`, `normalizeContentHtml`, `getImageUrl`, `getOriginalImageUrl`,
  `legacyHosts`, `uploadWithProgress`, `uploadDocumentForEditor`.
- `lib/variables.js` — API/IMAGE/SITE URL konfiqurasiyası (generic).
- `styles/editor-content.css` — redaktor + render üçün ORTAK CSS.

### RTK Query + fayl yükləmə (hibrid)
- **AI** tam RTK Query ilə: `store/api/aiApi.js` → `useProcessAIMutation` → `POST /ai/process`.
- **Post CRUD** RTK Query: `postApi` (`createPost`/`updatePost`/`getPostBySlug`).
- **Fayl yükləmə** isə `uploadWithProgress` (XHR) ilə qalır — çünki `fetch`/RTK Query
  yükləmə **progress** vermir. Token RTK auth slice-indən (`localStorage['auth'].accessToken`)
  oxunur, 401-də `/auth/refresh` ilə yenilənir (baseApi ilə eyni məntiq).

### Səhifələr
**client-react** (react-router):
- Admin: `/dashboard/posts/new` və `/dashboard/posts/:id/edit` → `PostEditorPage`.
- Public: `/posts/:slug` → `PostViewPage` (`<ArticleContent/>`).

**client-next** (App Router):
- Admin: `(protected)/dashboard/posts/new/page.js` və `[id]/edit/page.js` (`"use client"`).
- Public: `(public)/posts/[slug]/page.js` — **Server Component**, server-side fetch
  (`/posts/slug/:slug`), `generateMetadata` (SEO), `<ArticleContent/>`-i client sərhədində render edir.

### Env
```
# client-react/.env.example
VITE_IMAGE_URL=http://localhost:5000
VITE_SITE_URL=http://localhost:5173
VITE_LEGACY_IMAGE_HOSTS=

# client-next/.env.example
NEXT_PUBLIC_IMAGE_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_LEGACY_IMAGE_HOSTS=
```

---

## 5. İstifadə

### Admin — post yaz/redaktə et
```jsx
import { TiptapEditor } from '@/components/editor'   // (next: '@/components/editor')

<TiptapEditor
  content={content}
  onChange={setContent}
  onImageUpload={handleImageUpload}   // → POST /api/media/upload-image (field: image)
  onVideoUpload={handleVideoUpload}   // → POST /api/media/upload-video (field: video)
  onFileUpload={handleFileUpload}     // → uploadDocumentForEditor → /api/media/upload-document
/>
```
`handleImageUpload` `uploadWithProgress`-dən istifadə edir və `getImageUrl(url)` (tam URL) qaytarır.
Saxlama `useCreatePostMutation` / `useUpdatePostMutation` ilə `{ title, content, excerpt, status, tags }`.

### Public — post göstər
```jsx
import ArticleContent from '@/components/ArticleContent'
import '@/styles/editor-content.css'   // VACIB

<ArticleContent html={post.content} className="ProseMirror" />
```
`className`-ə **`ProseMirror`** ver — CSS qaydaları `.ProseMirror h2 {…}`, `.ProseMirror table {…}`
formatındadır.

---

## 6. Əlavə etmə / genişləndirmə

- **Yeni extension** əlavə etmək: `components/editor/parts/extensions.js`-də `buildExtensions`-a əlavə et.
- **Yeni AI əməliyyatı**: server `aiController.process`-də yeni `action` + client `useAIHandlers`.
- **Başqa resursda istifadə** (məs. `News`): həmin modelə `content: String` sahəsi əlavə et,
  admin səhifəsində `TiptapEditor`, public səhifədə `ArticleContent` istifadə et — server media/AI
  endpoint-ləri dəyişməz qalır.
- **Şəkil optimizasiyası**: `FileService.uploadImage` originalı `uploads/originals/`-də saxlayır;
  gələcəkdə əsas nüsxəni `sharp` ilə sıxa bilərsən, original toxunulmaz qalar.

## 7. Asılılıqlar (hər iki client-ə əlavə olundu)
`@tiptap/*` (core/react/pm/starter-kit + underline/link/image/text-align/highlight/placeholder/
character-count/subscript/superscript/color/text-style/youtube/table+row+cell+header), `katex`,
`embla-carousel` (+autoplay), `isomorphic-dompurify`, `react-easy-crop`. (`lucide-react`,
`sweetalert2` onsuz da şablonda var idi.)

> **Qeyd:** mənbə `tiptap-export/` qovluğu şablon repo-sunun bir hissəsi DEYİL — o, ayrıca
> təkrar-istifadə edilə bilən moduldur (öz `README.md` + `BUGS.md` ilə). Bu sənəd şablona
> inteqrasiya olunmuş, genericləşdirilmiş versiyanı təsvir edir.
