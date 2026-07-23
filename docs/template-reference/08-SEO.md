# 08 — SEO

Bu sənəd hər iki frontend-in **real tətbiq olunmuş** SEO sistemini təsvir edir:
- **`client-next`** — Next.js App Router Metadata API (SSR, tam SEO).
- **`client-react`** — `react-helmet-async` ilə client-side `<head>` idarəsi.

---

## A hissə — `client-next` (Next.js Metadata API)

### 1. Mərkəzi SEO konfiqurasiyası (`src/lib/seo.js`)

Bütün sayt səviyyəli defaultlar bir yerdədir. Yeni layihədə burada dəyişirsən:

```js
export const SITE_NAME = 'Starter'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const DEFAULT_TITLE = 'Starter — Fullstack Next.js Template'
export const DEFAULT_DESCRIPTION = 'A clean, generic fullstack starter template ...'
export const DEFAULT_IMAGE = '/og-image.png'
```

### 2. `buildMetadata()` helper (`src/lib/seo.js`)

Səhifə üçün Next.js `Metadata` obyekti quran köməkçi funksiya. Parametrləri:

| Parametr | Default | Rolu |
|----------|---------|------|
| `title` | — | Qısa səhifə başlığı (layout template ilə birləşir). |
| `description` | `DEFAULT_DESCRIPTION` | Meta description. |
| `path` | `''` | Canonical URL üçün yol (məs. `/login`). |
| `image` | `DEFAULT_IMAGE` | OG/Twitter şəkli (mütləq və ya kök-nisbi). |
| `noindex` | `false` | `true` olduqda crawler-lərə indexləməməyi bildirir. |

Qaytardığı obyekt bunları qurur: `title` (varsa layout template-i `%s | Starter`
ilə birləşir; yoxdursa `absolute: DEFAULT_TITLE` ilə template-i keçir),
`description`, `metadataBase`, `alternates.canonical`, tam `openGraph` (title,
description, url, siteName, `images` 1200×630, `type: 'website'`), `twitter`
(`summary_large_image` card) və `robots` (`noindex`-ə görə index/follow).

### 3. Root metadata + viewport (`src/app/layout.js`)

Kök layout bütün səhifələr üçün baza metadata-nı və **title template**-ini təyin edir:

```js
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: 'website', siteName: SITE_NAME, /* ... */ },
  twitter: { card: 'summary_large_image', /* ... */ },
  robots: { index: true, follow: true },
}

// viewport Next.js 14+ konvensiyası ilə metadata-dan AYRI export olunur:
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0891b2',
}
```

`title.template` sayəsində alt səhifədə sadəcə `title: 'Login'` versən, nəticə
`Login | Starter` olur. `themeColor`-u brendinlə əvəz et.

### 4. Səhifədə istifadə: `metadata` vs `generateMetadata`

**Statik metadata** (Server Component, sabit dəyər) — `app/(public)/page.js`:
```js
import { buildMetadata } from '@/lib/seo'
export const metadata = buildMetadata({ path: '/' })
```

**Statik title, `robots` override** — `app/(protected)/dashboard/layout.js`
(panel indexlənməməlidir):
```js
export const metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}
```

**Dinamik metadata** — məzmun runtime-da məlum olduqda `generateMetadata()`
funksiyasını export et (məs. `/posts/[slug]` üçün):
```js
export async function generateMetadata({ params }) {
  const post = await fetchPost(params.slug)
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/posts/${post.slug}`,
    image: post.coverImage,
  })
}
```

### 5. `sitemap.js` (`src/app/sitemap.js`)

`/sitemap.xml`-i avtomatik generasiya edir. İctimai route-ları massiv kimi qaytarır:
```js
export default function sitemap() {
  const now = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
```
Layihə böyüdükcə yeni ictimai route-ları buraya əlavə et (dinamik səhifələr üçün
DB-dən oxuyub map et).

### 6. `robots.js` (`src/app/robots.js`)

`/robots.txt`-i generasiya edir. Qorunan panel indexlənmədən çıxarılır:
```js
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

### 7. JSON-LD struktur data (`src/components/JsonLd.jsx`)

Schema.org struktur data-nı `<script type="application/ld+json">` kimi render edən
**Server Component** (`'use client'` yoxdur). JSON serverdə serialize olunub
`dangerouslySetInnerHTML` ilə yerləşdirilir (App Router-də tövsiyə olunan yol):
```jsx
export const JsonLd = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
)
```
İstifadə (`app/(public)/page.js`):
```jsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
}
return (<><JsonLd data={jsonLd} /> ...</>)
```
Data app-idarəlidir (istifadəçi girişi deyil), ona görə `dangerouslySetInnerHTML`
burada təhlükəsizdir. Məhsul/məqalə səhifələrində `@type`-ı `Product`/`Article`-ə dəyiş.

### 8. Open Graph + Twitter + viewport

- `buildMetadata` və root `metadata` hər ikisi tam **Open Graph** (title,
  description, url, siteName, 1200×630 şəkil, `type: 'website'`) və **Twitter**
  (`summary_large_image`) meta-larını qurur.
- `viewport` (mobil responsiv + `themeColor`) `layout.js`-də **ayrıca** export olunur.
- `next.config.mjs` əlavə olaraq təhlükəsizlik başlıqları (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) və `poweredByHeader: false`
  təyin edir.

---

## B hissə — `client-react` (`react-helmet-async`)

React SPA-da SSR olmadığı üçün `<head>` client-side idarə olunur.

### 1. `SEO` komponenti (`src/components/SEO.jsx`)

`react-helmet-async`-in `<Helmet>`-i üzərində per-page `<head>` teqləri:
```jsx
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'
const SITE_NAME = 'Starter'
const DEFAULT_TITLE = 'Starter — Fullstack Template'
const DEFAULT_DESCRIPTION = 'A generic fullstack starter template ...'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

export const SEO = ({ title, description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, path = '', noindex = false }) => {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const url = `${SITE_URL}${path}`
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {/* Open Graph + Twitter meta-ları */}
    </Helmet>
  )
}
```
Render etdiyi: `<title>`, `description`, `canonical`, (opsional) `robots noindex`,
tam Open Graph (`og:title/description/url/image/site_name`) və Twitter card
(`summary_large_image`).

### 2. Provider quraşdırması (`src/App.jsx`)

`<Helmet>` işləməsi üçün tətbiq `<HelmetProvider>` ilə bükülür (ən xarici):
```jsx
<HelmetProvider>
  <Provider store={store}>
    <SocketProvider>
      <AppRouter />
    </SocketProvider>
  </Provider>
</HelmetProvider>
```

### 3. Səhifədə istifadə (`src/pages/public/HomePage/HomePage.jsx`)

Hər səhifənin başında `<SEO>` render et:
```jsx
export const HomePage = () => (
  <>
    <SEO title="Home" path="/" />
    {/* səhifə məzmunu */}
  </>
)
```

### 4. Statik `<head>` fallback (`client-react/index.html`)

JS yüklənənə qədər görünən baza meta-lar birbaşa `index.html`-dədir: `<title>`,
`description`, `robots`, `theme-color` (`#0891b2`) və favicon (`/vite.svg`).
Yeni layihədə bunları da yenilə.

> **Məhdudiyyət:** `react-helmet` client-side işlədiyi üçün ilkin HTML statik
> `index.html` meta-larını daşıyır; per-route meta yalnız JS icrasından sonra
> tətbiq olunur. Tam crawler/SSR SEO lazımdırsa `client-next`-i seç.

---

## C hissə — Hər yeni səhifə üçün SEO yoxlama siyahısı

### Next.js (`client-next`)
- [ ] Səhifədə ya `export const metadata = buildMetadata({...})`, ya da dinamik
      məzmun üçün `export async function generateMetadata()`.
- [ ] `title` (qısa) və mənalı `description` ver — template `| Starter` əlavə edir.
- [ ] `path` düzgün canonical URL-ə uyğun olsun.
- [ ] Fərqli OG şəkli lazımdırsa `image` ver (yoxdursa `DEFAULT_IMAGE`).
- [ ] Şəxsi/panel səhifədirsə `noindex: true` (və ya `robots: { index: false }`).
- [ ] İctimai route-dursa `app/sitemap.js`-ə əlavə et.
- [ ] Uyğun gəlirsə `<JsonLd>` ilə struktur data (`WebSite`/`Article`/`Product`).

### React (`client-react`)
- [ ] Səhifənin ən üstündə `<SEO title="..." path="/..." />`.
- [ ] Fərqli `description`/`image` lazımdırsa prop kimi ötür.
- [ ] Şəxsi səhifədirsə `noindex` prop-u.
- [ ] `<HelmetProvider>` mövcud olduğundan əmin ol (App.jsx-də var).

### Hər iki stack (yeni layihə başlanğıcı)
- [ ] `SITE_NAME`, `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION`, `DEFAULT_IMAGE`
      dəyərlərini brendinlə əvəz et (`lib/seo.js` və ya `SEO.jsx`).
- [ ] `SITE_URL` / `VITE_SITE_URL` / `NEXT_PUBLIC_SITE_URL`-i real domenə təyin et.
- [ ] `public/og-image.png` (1200×630) və favicon əlavə et.
- [ ] `themeColor` (`#0891b2`) brend rəngini dəyiş.
