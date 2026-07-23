# Client (Next.js) — App Router Template

Generic Next.js starter (`starter-client-next`, v1.0.0). Bu paket bir Next.js **App Router** tətbiqinin yenidən istifadə oluna bilən skeletidir: React 19 üzərində qurulub, route qrupları ilə public/protected bölgü, Edge `middleware.js` route guard, SSR-safe Redux Toolkit + RTK Query, cookie-mirror sessiya və tam SEO infrastrukturu (Metadata API, sitemap, robots, JSON-LD) gəlir. `server/` template-i ilə birbaşa uyğun işləyir.

- **Framework:** Next.js `^16.2.10` (App Router)
- **UI:** React `^19.2.7` + Tailwind CSS `^4.3.2`
- **State/Data:** Redux Toolkit `^2.12.0` + RTK Query
- **Real-time:** `socket.io-client` `^4.8.3`
- **Package manager:** pnpm (`pnpm-workspace.yaml` ilə build-script icazələri)

---

## Məqsəd

Next.js App Router layihələrində eyni infrastrukturu təkrar qurmamaq üçün hazır gələn əsas hissələr:

- **App Router strukturu** — `(public)` / `(protected)` route qrupları, `layout` / `loading` / `error` / `not-found` xüsusi faylları.
- **`middleware.js` route guard** — cookie-yə mirror olunmuş token vasitəsilə server tərəfində `/dashboard` qorunması.
- **SSR-safe `authSlice`** — hər browser API girişi `typeof window` ilə qorunur; store server render/build zamanı təhlükəsiz import olunur.
- **Cookie mirror** — access token localStorage-a əlavə olaraq `token` cookie-sinə yazılır ki, Edge middleware onu oxuya bilsin.
- **SEO infrastrukturu** — `lib/seo.js` (`buildMetadata`), `generateMetadata`/`metadata` export-ları, `sitemap.js`, `robots.js`, `JsonLd` komponenti.
- **RTK Query reauth** — 401-də avtomatik token yeniləmə (React template ilə eyni məntiq).

---

## Qovluq ağacı (annotasiyalı)

`node_modules` və `.next` xaric:

```
client-next/
├── .env.example              # NEXT_PUBLIC_API_URL + NEXT_PUBLIC_SITE_URL
├── .gitignore
├── eslint.config.mjs         # Flat config: eslint-config-next/core-web-vitals spread
├── jsconfig.json             # @/* → ./src/* alias
├── middleware.js             # Edge auth guard (cookie `token` yoxlaması)
├── next.config.mjs           # Security header-lər, images, poweredByHeader:false
├── postcss.config.mjs        # @tailwindcss/postcss plugini
├── pnpm-workspace.yaml       # allowBuilds: sharp + unrs-resolver (native build icazələri)
├── package.json
└── src/
    ├── app/                  # ===== APP ROUTER =====
    │   ├── layout.js         # Root layout: <html>, metadata (title template), viewport, <Providers>
    │   ├── providers.jsx     # 'use client' — Redux Provider + SocketProvider
    │   ├── loading.js        # Route-level loading UI (PageLoader)
    │   ├── error.js          # 'use client' — segment error boundary
    │   ├── not-found.js      # 404 səhifəsi
    │   ├── sitemap.js        # /sitemap.xml generatoru
    │   ├── robots.js         # /robots.txt generatoru (/dashboard disallow)
    │   │
    │   ├── (public)/         # ROUTE QRUPU — public səhifələr (URL-ə təsir etmir)
    │   │   ├── page.js        # / (HomePage) — metadata = buildMetadata, JsonLd
    │   │   ├── login/page.js  # /login
    │   │   └── register/page.js  # /register
    │   │
    │   └── (protected)/      # ROUTE QRUPU — qorunan səhifələr
    │       └── dashboard/
    │           ├── layout.js  # Dashboard shell (DashboardSidebar) + noindex metadata
    │           ├── page.js    # /dashboard ('use client', recharts)
    │           ├── posts/page.js    # /dashboard/posts
    │           └── profile/page.js  # /dashboard/profile
    │
    ├── components/
    │   ├── index.js          # ui/*, JsonLd, DashboardSidebar barrel
    │   ├── DashboardSidebar.jsx  # Client sidebar shell
    │   ├── JsonLd.jsx         # Server Component — schema.org JSON-LD <script>
    │   └── ui/               # Tailwind UI kit (React template ilə eyni dəst)
    │       ├── index.js
    │       ├── Button.jsx  Input.jsx  Textarea.jsx  Select.jsx  CustomSelect.jsx
    │       ├── Checkbox.jsx  Radio.jsx  Card.jsx  Modal.jsx  Table.jsx
    │       ├── Badge.jsx  StatCard.jsx  PageLoader.jsx
    │
    ├── lib/
    │   └── seo.js            # SITE_* sabitləri + buildMetadata() köməkçisi
    │
    ├── store/
    │   ├── index.js          # configureStore (SSR-safe qeyd ilə)
    │   ├── api/
    │   │   ├── index.js       # baseApi + feature barrel
    │   │   ├── baseApi.js     # fetchBaseQuery + reauth wrapper
    │   │   ├── authApi.js     # /api/auth endpointləri
    │   │   └── postApi.js     # NÜMUNƏ CRUD (/api/posts)
    │   ├── slices/
    │   │   └── authSlice.js   # SSR-safe auth state + cookie mirror
    │   └── context/
    │       └── SocketContext.jsx  # 'use client' Socket.IO provider
    │
    └── styles/
        └── globals.css       # Tailwind + qlobal stillər
```

---

## `@/*` Alias

Sadə tək alias — `jsconfig.json`:

```jsonc
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
```

İstifadə:

```js
import { store } from '@/store'
import { buildMetadata, SITE_NAME } from '@/lib/seo'
import { StatCard, Card } from '@/components/ui'
import { JsonLd } from '@/components/JsonLd'
```

> Next.js `@/*` alias-ını `jsconfig.json`-dan avtomatik oxuyur — React template-dəki kimi ayrıca bundler konfiqurasiyası lazım deyil.

---

## App Router strukturu

### Route qrupları — `(public)` / `(protected)`

Mötərizədəki qovluqlar **route group**-dur: kodu təşkil etmək üçündür, **URL-ə əlavə seqment qatmır**. Yəni `app/(public)/login/page.js` → `/login`, `app/(protected)/dashboard/page.js` → `/dashboard`.

### Xüsusi fayllar

| Fayl | Rolu |
|---|---|
| `app/layout.js` | Root layout (Server Component). `<html>`/`<body>`, qlobal metadata (title template `%s \| Starter`), `viewport`, `<Providers>` sarğısı. |
| `app/providers.jsx` | `'use client'` — Redux `Provider` + `SocketProvider`. Store yalnız client-də instansiya olunur. |
| `app/loading.js` | Naviqasiya/streaming zamanı göstərilən yükləmə UI-ı. |
| `app/error.js` | `'use client'` — seqment üçün error boundary (`reset()` düyməsi ilə). |
| `app/not-found.js` | Uyğun gəlməyən route-lar üçün 404. |
| `(protected)/dashboard/layout.js` | Dashboard shell (`DashboardSidebar`) + `robots: { index: false }`. |

### `middleware.js` guard

Edge middleware `/dashboard/*`, `/login`, `/register` route-larında işləyir (`config.matcher`):

- `token` cookie-si **yoxdursa** və yol `/dashboard`-la başlayırsa → `/login`-ə yönləndirir (`?from=...` ilə).
- `token` **varsa** və istifadəçi `/login` və ya `/register`-dədirsə → `/dashboard`-a yönləndirir.

> **Vacib:** Bu yüngül UX guard-dır, təhlükəsizlik sərhədi deyil. Əsl avtorizasiya həmişə JWT-ni doğrulayan API server-də baş verir. localStorage Edge-də oxunmadığı üçün token **cookie-yə mirror** olunur (aşağıda).

---

## RTK store axını (SSR-safe)

### `store/index.js`

```js
configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer, auth: authReducer },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
})
```

Store `providers.jsx` (Client Component) daxilində qurulur. `authSlice` ilkin state-i **SSR-safe** oxuduğu üçün bu modulun server render/build zamanı import olunması təhlükəsizdir.

### `authSlice.js` — SSR-safe + cookie mirror

Hər browser API girişi `isBrowser()` (`typeof window !== 'undefined'`) ilə qorunur — beləliklə reducer server-də də import oluna bilər:

| Konsept | Detal |
|---|---|
| `STORAGE_KEY = 'auth'` | localStorage-dəki persist blob-un açarı. |
| `TOKEN_COOKIE = 'token'` | Middleware-in oxuduğu cookie adı. |
| **Cookie mirror** | `setCredentials`/`setTokens` access token-i həm localStorage-a, həm də `token` cookie-sinə (7 gün, `SameSite=Lax`) yazır. `logout` hər ikisini təmizləyir. |

Reducer-lər: `setCredentials({ user, tokens })`, `setTokens({ accessToken, refreshToken })`, `updateUser(partial)`, `logout()` — React template ilə eyni, əlavə olaraq cookie sinxronizasiyası.

### `baseApi.js` — reauth

React template ilə eyni məntiq: `baseUrl = ${NEXT_PUBLIC_API_URL}/api`, `prepareHeaders` token əlavə edir, 401-də `POST /auth/refresh` → uğurlu olsa `auth/setTokens` + orijinal sorğu təkrar, alınmasa `auth/logout`. `tagTypes: ['User', 'Post', 'Auth']`. Feature endpoint-ləri `injectEndpoints` ilə `authApi.js` / `postApi.js`-də əlavə olunur.

> `NEXT_PUBLIC_*` dəyişənləri Next tərəfindən **build zamanı inline** olunur, ona görə də browser-də əlçatandır.

---

## SEO infrastrukturu

### `lib/seo.js` — mərkəzi konfiqurasiya + `buildMetadata`

```js
export const SITE_NAME = 'Starter'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const DEFAULT_TITLE = 'Starter — Fullstack Next.js Template'
export const DEFAULT_DESCRIPTION = '...'
export const DEFAULT_IMAGE = '/og-image.png'
```

`buildMetadata({ title, description, path, image, noindex })` bir Next.js `Metadata` obyekti qaytarır: canonical URL, Open Graph, Twitter card və `robots`. Root layout `title.template = '%s | Starter'` təyin etdiyi üçün sən qısa `title` verirsən, o avtomatik kompоzisiya olunur.

### İstifadə formaları

- **Statik metadata** (Server Component page-də):
  ```js
  export const metadata = buildMetadata({ path: '/' })
  ```
- **Dinamik metadata** (parametrə əsaslı):
  ```js
  export async function generateMetadata({ params }) {
    return buildMetadata({ title: `Post ${params.id}`, path: `/posts/${params.id}` })
  }
  ```
- **Root metadata** — `app/layout.js`-də qlobal `metadata` + `viewport` (themeColor) export-ları.

### `sitemap.js` və `robots.js`

- `app/sitemap.js` → `/sitemap.xml`. Public route-lar (`/`, `/login`, `/register`) `url`/`lastModified`/`changeFrequency`/`priority` ilə. Yeni public səhifə əlavə edəndə buraya da yaz.
- `app/robots.js` → `/robots.txt`. `allow: '/'`, `disallow: ['/dashboard']`, `sitemap` linki.

### `JsonLd` komponenti

`components/JsonLd.jsx` — **Server Component**. schema.org strukturlu datanı `dangerouslySetInnerHTML` ilə `<script type="application/ld+json">` kimi inject edir (App Router-də tövsiyə olunan üsul). Nümunə (`(public)/page.js`):

```jsx
<JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL }} />
```

---

## Kitabxanalar cədvəli

`package.json`-dan **dəqiq versiyalar**:

### `dependencies`

| Paket | Versiya | Rolu |
|---|---|---|
| `next` | `^16.2.10` | Framework (App Router, SSR, Metadata API) |
| `react` | `^19.2.7` | UI kitabxanası |
| `react-dom` | `^19.2.7` | DOM renderer |
| `@reduxjs/toolkit` | `^2.12.0` | State + RTK Query |
| `react-redux` | `^9.3.0` | React ↔ Redux |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket client |
| `framer-motion` | `^12.42.2` | Animasiyalar |
| `lucide-react` | `^1.23.0` | İkonlar |
| `recharts` | `^3.9.2` | Qrafiklər (dashboard) |
| `sweetalert2` | `^11.26.25` | Modal/alert bildirişləri |
| `date-fns` | `^4.4.0` | Tarix formatlaması |
| `clsx` | `^2.1.1` | Şərti className |

### `devDependencies`

| Paket | Versiya | Rolu |
|---|---|---|
| `tailwindcss` | `^4.3.2` | Utility-first CSS |
| `@tailwindcss/postcss` | `^4.3.2` | Tailwind v4 PostCSS plugini |
| `eslint` | `^9` | Linter |
| `eslint-config-next` | `^16.2.10` | Next.js flat ESLint config |
| `@types/react`, `@types/react-dom` | `^19.2.17`, `^19.2.3` | Tip tərifləri |

> `pnpm-workspace.yaml` `sharp` (Next image optimallaşdırma) və `unrs-resolver` (ESLint import resolver) üçün native build icazələrini (`allowBuilds`) verir — `pnpm install`-ın təmiz keçməsi üçün.

---

## Run əmrləri

```bash
pnpm install

pnpm dev        # → next dev   (default http://localhost:3000)
pnpm build      # → next build (istehsal buildi)
pnpm start      # → next start (build-i serve et)
pnpm lint       # → eslint .   (Next 16-da "next lint" ləğv edilib)
```

---

## `.env.example`

```bash
# API server-in baza URL-i (sonda slash olmadan). RTK base query buna `/api`
# əlavə edir, ona görə server root-una yönəlt.
NEXT_PUBLIC_API_URL=http://localhost:5000

# Public sayt URL-i — canonical linklər, sitemap və Open Graph metadata üçün.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_` prefiksli dəyişənlər build zamanı kliyentə inline olunur (prefiks olmayanlar yalnız server-də əlçatan olar).

---

## Yeni route / page / slice necə əlavə olunur

### Yeni public route

1. `src/app/(public)/about/page.js` yarat:

```js
import { buildMetadata } from '@/lib/seo'
export const metadata = buildMetadata({ title: 'About', path: '/about' })

export default function AboutPage() {
  return <main>...</main>
}
```

2. `/about` avtomatik işə düşür (route group URL-ə seqment qatmır).
3. İndeksləşmə istəyirsənsə `app/sitemap.js`-ə `/about` sətrini əlavə et.

### Yeni protected route

`src/app/(protected)/dashboard/settings/page.js` yarat — o avtomatik `dashboard/layout.js` (sidebar + noindex) və `middleware.js` guard-ı altına düşür:

```js
'use client'   // interaktiv (hook, event) lazımsa
export default function SettingsPage() {
  return <div>...</div>
}
```

### Dinamik metadata olan page

```js
export async function generateMetadata({ params }) {
  return buildMetadata({ title: `Post ${params.slug}`, path: `/posts/${params.slug}` })
}
export default function PostPage({ params }) { /* ... */ }
```

### Yeni slice

React template ilə eyni: `store/slices/xyzSlice.js` yarat, `store/index.js`-də reducer-ə qoş. **Vacib qeyd:** əgər slice browser API-yə (localStorage, document, window) toxunursa, `authSlice.js`-dəki kimi hər girişi `typeof window !== 'undefined'` ilə qoru — əks halda server render/build zamanı sınacaq.

### Yeni API endpoint

`store/api/postApi.js`-i kopyala, yeni fayl (`store/api/xyzApi.js`) yarat, `injectEndpoints` ilə əlavə et, `store/api/index.js`-ə export et və lazımsa `baseApi.js`-dəki `tagTypes`-a yeni tag qoş (React template README-sindəki addımlarla eyni).

### Client vs Server komponent qaydası

- Default hər komponent **Server Component**-dir (data fetch, metadata, JSON-LD üçün ideal).
- `useState`/`useEffect`/hook/event handler/Redux hook lazımdırsa faylın başına `'use client'` yaz (bax `dashboard/page.js`, `error.js`, `SocketContext.jsx`).
