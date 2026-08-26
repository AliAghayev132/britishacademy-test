# TipTap Editor — köçürülə bilən paket

British Academy layihəsindəki rich-text editorun tam kodu. Başqa layihədə
işlətmək üçün ayrılıb: kod bu qovluqdakı MD fayllarında, aşağıda isə nəyi
necə bağlamaq lazım olduğu yazılıb.

TipTap **v3** üzərində qurulub, React + Next.js (App Router) mühitində
işlənib. Editor client komponentdir — faylın başında `"use client"` var.

---

## Fayllar

| Fayl | Nə var | Ölçü |
|---|---|---|
| [01-core.md](01-core.md) | `TiptapEditor.jsx` — giriş nöqtəsi, panel, önizləmə | 18 KB |
| [02-extensions.md](02-extensions.md) | Genişlənmələr, sabitlər, kollaj/slayder node-ları | 48 KB |
| [03-toolbar.md](03-toolbar.md) | Panel düymələri, başlıq/şrift/rəng seçiciləri | 27 KB |
| [04-menus.md](04-menus.md) | Fayl, video və cədvəl menyuları | 51 KB |
| [05-pickers.md](05-pickers.md) | Kollaj + slayder seçiciləri, crop dialoqu | 63 KB |
| [06-styles.md](06-styles.md) | `editor-content.css` | 19 KB |
| [07-helpers.md](07-helpers.md) | Sanitizasiya, yükləmə, şəkil URL köməkçiləri | 15 KB |

Qovluq quruluşu (hədəf layihədə):

```
components/editor/
├── index.js
├── TiptapEditor.jsx
└── parts/
    ├── Primitives.jsx          HeadingDropdown.jsx
    ├── FontPicker.jsx          ColorPickerPopover.jsx
    ├── LinkInput.jsx           ImageToolbar.jsx
    ├── FileMenu.jsx            VideoMenu.jsx
    ├── TableMenu.jsx           CollagePicker.jsx
    ├── CollageCropDialog.jsx   SliderPicker.jsx
    ├── extensions.js           constants.js
    ├── utils.js
    ├── ImageCollageExtension.js
    └── ImageSliderExtension.js
styles/editor-content.css
```

---

## Quraşdırma

```bash
pnpm add @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-character-count @tiptap/extension-color \
  @tiptap/extension-highlight @tiptap/extension-image \
  @tiptap/extension-link @tiptap/extension-placeholder \
  @tiptap/extension-subscript @tiptap/extension-superscript \
  @tiptap/extension-table @tiptap/extension-table-cell \
  @tiptap/extension-table-header @tiptap/extension-table-row \
  @tiptap/extension-text-align @tiptap/extension-text-style \
  @tiptap/extension-underline @tiptap/extension-youtube \
  lucide-react react-easy-crop isomorphic-dompurify
```

Sınanmış versiyalar: bütün `@tiptap/*` paketləri **3.27.3**, `lucide-react`
1.23.0, `react-easy-crop` 6.2.2, `isomorphic-dompurify` 3.18.0.

> **Vacib:** bütün `@tiptap/*` paketləri **eyni versiyada** olmalıdır. Fərqli
> minor versiyalar qarışanda ProseMirror nüsxəsi ikiləşir və editor səssizcə
> sınır (kursor itir, əmrlər işləmir).

### Next.js qeydi

`isomorphic-dompurify` server tərəfdə `jsdom` işlədir, o da öz fayllarını
`__dirname`-ə nisbətən oxuyur. Webpack onu paketləyəndə bu yol sınır və
build `ENOENT ... browser/default-stylesheet.css` verir. `next.config.mjs`-ə
əlavə edin:

```js
serverExternalPackages: ['jsdom', 'isomorphic-dompurify'],
```

---

## İstifadə

```jsx
import TiptapEditor from '@/components/editor';
import '@/styles/editor-content.css';

<TiptapEditor
  content={html}
  onChange={setHtml}
  onImageUpload={async (file) => (await upload(file)).url}
  onVideoUpload={async (file) => (await upload(file)).url}
  onFileUpload={async (file) => (await upload(file)).url}
  minHeight={500}
  placeholder="Məzmununuzu buraya yazın..."
  maxCharacters={null}
/>
```

### Props

| Prop | Tip | Defolt | Təsvir |
|---|---|---|---|
| `content` | `string` | `''` | Başlanğıc HTML |
| `onChange` | `(html) => void` | — | Hər dəyişiklikdə çağırılır |
| `onImageUpload` | `async (File) => string` | — | URL qaytarmalıdır |
| `onVideoUpload` | `async (File) => string` | — | URL qaytarmalıdır |
| `onFileUpload` | `async (File) => string` | — | URL qaytarmalıdır |
| `minHeight` | `number` | `500` | Minimum hündürlük (px) |
| `placeholder` | `string` | AZ mətn | Boş editorda görünən mətn |
| `maxCharacters` | `number \| null` | `null` | Simvol limiti; `null` = limitsiz |

Yükləmə funksiyaları **prop-dur** — editorun içində sabit API ünvanı yoxdur,
ona görə başqa backend-ə bağlamaq üçün heç bir faylı redaktə etmək lazım
deyil. Nümunə tətbiq: `07-helpers.md` → `uploadWithProgress.js`.

---

## Layihəyə bağlı iki yer

Editor öz qovluğundan kənarda **yalnız iki şey** import edir. Hər ikisi
`TiptapEditor.jsx`-dədir və asanlıqla əvəzlənir.

**1. `confirmDialog`** — «Təmizlə» düyməsində təsdiq soruşur.

```js
import { confirmDialog } from '@/components/ui/feedback';
```

Sadə əvəzləmə:

```js
const confirmDialog = async ({ text }) => window.confirm(text);
```

**2. `sanitizeHtml`** — önizləmə rejimində HTML-i təhlükəsizləşdirir.
Faylı `07-helpers.md`-dən olduğu kimi götürün. Atlamaq **tövsiyə olunmur**:
editor `dangerouslySetInnerHTML` ilə render edir.

---

## Public render tərəfi

Saxlanmış HTML-i saytda göstərəndə **eyni CSS lazımdır**, əks halda cədvəl,
kollaj və slayder fərqli görünəcək:

```jsx
import '@/styles/editor-content.css';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

<div
  className="editor-content"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
/>
```

Kollaj və slayder **öz node-larıdır** və HTML-ə adi `<figure>` kimi yazılır —
public tərəfdə əlavə JavaScript tələb etmir, yalnız CSS.

---

## Nəyi atmaq olar

| Lazım deyilsə | Silinəcək fayllar | Paket |
|---|---|---|
| Kollaj | `CollagePicker.jsx`, `CollageCropDialog.jsx`, `ImageCollageExtension.js` | `react-easy-crop` |
| Slayder | `SliderPicker.jsx`, `ImageSliderExtension.js` | — |
| Cədvəl | `TableMenu.jsx` | `@tiptap/extension-table*` (4 paket) |
| YouTube | — | `@tiptap/extension-youtube` |

Hər halda `parts/extensions.js`-dən müvafiq sətirləri, `TiptapEditor.jsx`-dən
isə həmin düymələri çıxarmaq lazımdır.

---

## Bilinən davranışlar

- Editor `"use client"`-dir; server komponentdən birbaşa import etmək olmaz.
- Önizləmə rejimi `editor.getHTML()`-i sanitizasiyadan keçirir — yəni
  önizləmədə gördüyünüz public səhifədəki ilə eynidir.
- Şrift siyahısı `parts/constants.js`-dədir; hədəf layihədə həmin şriftlərin
  yüklü olduğuna əmin olun, yoxsa seçim heç nəyi dəyişməyəcək.
