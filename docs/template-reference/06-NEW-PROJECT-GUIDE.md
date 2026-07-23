# 06 — Yeni Layihəyə Başlama Bələdçisi

Bu sənəd `fullstack-starter` şablonundan **sıfırdan yeni bir layihə** yaratmağın
addım-addım təlimatıdır. Şablon üç müstəqil paketdən ibarətdir:

| Qovluq | Nədir | Nə vaxt seçilir |
|--------|-------|-----------------|
| `server/` | Express 5 + Mongoose 9 backend (auth + OTP + Post CRUD) | Həmişə lazımdır (API) |
| `client-react/` | React 19 + Vite 8 SPA (react-router 8) | SEO kritik olmayan panel/SPA üçün |
| `client-next/` | Next.js 16 App Router (SSR + Metadata API) | SEO və server render lazım olduqda |

**Vacib:** `client-react` və `client-next` eyni backend-lə işləyir və eyni domen
modelini (User + OTP + Post) paylaşır. Adətən **birini** seçirsən — hər ikisini
saxlamağa ehtiyac yoxdur.

---

## 1. Hansı qovluqları köçürmək

### Variant A — React SPA layihəsi
```
server/         → yeni-layihe/server
client-react/   → yeni-layihe/client
```

### Variant B — Next.js layihəsi
```
server/         → yeni-layihe/server
client-next/    → yeni-layihe/client
```

Köçürərkən bu qovluq/faylları **köçürmə** (onlar `.gitignore`-dadır və yenidən
yaradılır): `node_modules/`, `dist/` (react), `.next/` (next), `uploads/` (server),
`.env` faylların özü.

Sürətli üsul (məs. React variantı üçün, Git Bash):
```bash
mkdir -p /c/Users/aghay/Desktop/Projects/yeni-layihe
cp -r server /c/Users/aghay/Desktop/Projects/yeni-layihe/server
cp -r client-react /c/Users/aghay/Desktop/Projects/yeni-layihe/client
cd /c/Users/aghay/Desktop/Projects/yeni-layihe
# node_modules və build artefaktlarını təmizlə
rm -rf server/node_modules server/uploads client/node_modules client/dist
```

---

## 2. Paketin adını dəyişmək (`package.json` → `name`)

Hər paketdə `name` sahəsini öz layihə adınla əvəz et:

| Fayl | Cari dəyər | Nümunə yeni dəyər |
|------|-----------|-------------------|
| `server/package.json` | `starter-server` | `myapp-server` |
| `client-react/package.json` | `starter-client-react` | `myapp-client` |
| `client-next/package.json` | `starter-client-next` | `myapp-web` |

Qeyd: `server/package.json`-un `imports` bölməsindəki `#lib`, `#config`, `#services`
və s. **alias**-ları dəyişmə — bütün import-lar onlara söykənir.

---

## 3. `.env` faylını `.env.example`-dən doldurmaq

Hər paketdə `.env.example` var. Onu `.env`-ə köçür və dəyərləri doldur:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env      # react üçün
# və ya Next üçün:
cp client/.env.example client/.env.local
```

### 3.1. Server dəyişənləri (`server/.env`)

Faylın strukturu (`server/.env.example` ilə birə-bir):

```env
# ============ SERVER ============
NODE_ENV=development
PORT=5000
# ============ DATABASE ============
MONGODB_URI=mongodb://localhost:27017/starter
DB_HOST=localhost
DB_NAME=starter
DB_USERNAME=
DB_PASSWORD=
DB_CLUSTER_NAME=
# ============ AUTH SECRETS ============
ACCESS_SECRET_KEY=change_me_access_secret_min_32_chars
REFRESH_SECRET_KEY=change_me_refresh_secret_min_32_chars
ENCRYPTION_KEY=change_me_32_character_encryption_key
# ============ URLS / DOMAIN ============
DOMAIN=localhost
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
# ============ SMTP ============
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
# ============ DEFAULT ADMIN ============
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=Admin123!
```

Hər dəyişənin izahı:

| Dəyişən | Rolu | İzah |
|---------|------|------|
| `NODE_ENV` | Mühit rejimi | `development` və ya `production`. `production`-da `config/config.js` cookie-ləri `secure`+`strict` edir, CORS whitelist-i sərtləşir, `app.js`-də `validateEnv()` işə düşür. |
| `PORT` | Server portu | `config.development.port` bunu oxuyur (default `5000`). `app.js` bu portda dinləyir. |
| `MONGODB_URI` | Tam MongoDB bağlantı sətri | Varsa, `MongoDBService.connect()` **birbaşa** bunu istifadə edir (Atlas üçün tövsiyə). |
| `DB_HOST` / `DB_NAME` / `DB_USERNAME` / `DB_PASSWORD` / `DB_CLUSTER_NAME` | DB hissələri | `MONGODB_URI` **yoxdursa**, fallback olaraq `mongodb://localhost:27017/${DB_NAME}` qurulur. Praktikada lokal üçün yalnız `DB_NAME` kifayətdir. |
| `ACCESS_SECRET_KEY` | Access JWT açarı | `AuthTokenService.generateAccessToken` bununla imzalayır (15 dəq). **Ən azı 32 təsadüfi simvol.** |
| `REFRESH_SECRET_KEY` | Refresh JWT açarı | Refresh token (7 gün / rememberMe 30 gün) bununla imzalanır. Access açarından **fərqli** olmalıdır. |
| `ENCRYPTION_KEY` | Simmetrik şifrə açarı | `EncryptionService` (AES-256-GCM) və `AuthTokenService` reset-token bununla işləyir. 32 simvol. |
| `DOMAIN` | Əsas domen | Production-da cookie domeni (`.${DOMAIN}`) və CORS (`https://${DOMAIN}`, `https://www.${DOMAIN}`) buradan qurulur. |
| `APP_URL` | Backend-in öz URL-i | E-poçt linkləri / mütləq URL-lər üçün (`config.appUrl`). |
| `CLIENT_URL` | Frontend URL-i | CORS whitelist-ə düşür və welcome e-poçtundakı linkdə istifadə olunur (`config.clientUrl`). React default `http://localhost:5173`, Next `http://localhost:3000`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | E-poçt göndərişi | `MailService.init()` transporter yaradır. **`SMTP_USER` və `SMTP_PASS` boşdursa e-poçt göndərişi no-op olur** (OTP konsola düşmür — real SMTP lazımdır). Gmail üçün `SMTP_SECURE=false` + port `587` + App Password. |
| `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` | İlk admin | `BootstrapService.bootstrapAdmin()` ilk açılışda admin yoxdursa bu məlumatlarla `role: "admin"` istifadəçi yaradır. İlk login-dən sonra şifrəni dəyiş. |

### 3.2. `client-react` dəyişəni (`client-react/.env`)

```env
VITE_API_URL=http://localhost:5000
```

| Dəyişən | İzah |
|---------|------|
| `VITE_API_URL` | Backend-in **kök** URL-i (sonunda `/api` **olmadan**). `store/api/baseApi.js` sona `/api` əlavə edir, `SocketContext.jsx` isə birbaşa bu origin-ə Socket.IO qoşulur. |

Qeyd: `SEO.jsx` daxilində `VITE_SITE_URL` da oxunur (canonical/OG üçün, default
`http://localhost:5173`). Production-da onu da təyin et.

### 3.3. `client-next` dəyişənləri (`client-next/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Dəyişən | İzah |
|---------|------|
| `NEXT_PUBLIC_API_URL` | API server-in kök URL-i (sona `/api` `baseApi.js`-də əlavə olunur). `NEXT_PUBLIC_` prefiksi Next.js-in dəyəri brauzerə inline etməsi üçün vacibdir. |
| `NEXT_PUBLIC_SITE_URL` | İctimai sayt URL-i. `lib/seo.js` canonical linklər, `sitemap.js`, `robots.js` və Open Graph metadata üçün istifadə edir. |

---

## 4. Asılılıqları quraşdırmaq və dev rejimdə işə salmaq

İstifadəçinin standartı **pnpm**-dir (npm də işləyər). Hər paketi ayrıca qur.

### Server
```bash
cd server
pnpm install
pnpm dev          # nodemon app.js  (canlı restart)
# və ya production: pnpm start   → node app.js
```
Uğurlu açılışda konsolda banner + `✅ MongoDB connected` + admin bootstrap mesajı görünür.

### client-react
```bash
cd client
pnpm install
pnpm dev          # vite      → http://localhost:5173
pnpm build        # vite build → dist/
pnpm preview      # build-in lokal önizləməsi
```

### client-next
```bash
cd client
pnpm install      # pnpm-workspace.yaml sharp + unrs-resolver build-lərini icazələndirir
pnpm dev          # next dev  → http://localhost:3000
pnpm build        # next build
pnpm start        # next start (production)
```

MongoDB lokal olaraq işləməlidir (`mongodb://localhost:27017`) və ya `MONGODB_URI`
Atlas-a baxmalıdır. DB-ni sıfırlamaq üçün: `node scripts/resetDatabase.js`
(User, OTP, Post kolleksiyalarını təmizləyir — yalnız dev/test).

---

## 5. Dəyişdirilməli şeylərin yoxlama siyahısı (checklist)

Yeni layihəni "öz adına salmaq" üçün minimum:

- [ ] **Paket adları** — hər `package.json`-da `name` (bax bölmə 2).
- [ ] **Sayt adı** — `server/config/config.js` → `siteName: "Starter"`. Bu ad
      e-poçt "from" başlığında (`MailService`) və startup banner-ində görünür.
- [ ] **Cookie prefiksləri** — `config.js` → `accessCookieName: "__starter_at"`,
      `refreshCookieName: "__starter_rt"` (öz brendinlə əvəz et).
- [ ] **JWT / şifrə açarları** — `.env`-də `ACCESS_SECRET_KEY`, `REFRESH_SECRET_KEY`,
      `ENCRYPTION_KEY` **mütləq** güclü təsadüfi dəyərlərlə (məs. `openssl rand -hex 32`).
- [ ] **DB adı** — `.env` → `MONGODB_URI` / `DB_NAME` (`starter` → `myapp`).
- [ ] **CORS origin-ləri** — production dəyərləri `config.js`-dəki `corsConfig`
      `DOMAIN` + `CLIENT_URL`-dən avtomatik qurulur; dev origin-ləri (`5173`, `3000`)
      lazım deyilsə oradan çıxar.
- [ ] **Default admin** — `.env` → `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`.
- [ ] **SEO defaultları** —
      React: `client-react/src/components/SEO.jsx` (`SITE_NAME`, `DEFAULT_TITLE`,
      `DEFAULT_DESCRIPTION`, `DEFAULT_IMAGE`) + `index.html`-dəki `<title>`/`<meta>`.
      Next: `client-next/src/lib/seo.js` (`SITE_NAME`, `SITE_URL`, `DEFAULT_TITLE`,
      `DEFAULT_DESCRIPTION`, `DEFAULT_IMAGE`) + `app/layout.js`. (Ətraflı: `08-SEO.md`)
- [ ] **Favicon / og-image** —
      React: `client-react/public/` (`index.html`-də `href="/vite.svg"` dəyiş) +
      `theme-color`. Next: `client-next/src/app/`-a `icon.png`/`favicon.ico` və
      `public/og-image.png` əlavə et (`DEFAULT_IMAGE = '/og-image.png'`).
- [ ] **`viewport.themeColor`** — Next `app/layout.js` və React `index.html`-də
      `#0891b2` (cyan) rəngini brendinlə əvəz et.
- [ ] **robots/sitemap** — Next: `app/robots.js` və `app/sitemap.js`-də route-ları yenilə.

---

## 6. Server-ə yeni resurs əlavə etmək (real `Post` nümunəsi)

`Post` qəsdən **referans (copy-paste) nümunəsi** kimi qurulub. Yeni resurs (məs.
`Product`) üçün eyni 5 addımı təkrarla:

### Addım 1 — Model (`server/models/product.model.js`)
`post.model.js` bütün Mongoose konvensiyalarını nümayiş etdirir: compound index,
virtual (`url`), static (`findPublished`), instance method (`incrementViews`),
`pre("save")` slug hook, `toJSON: { virtuals: true }`.
```js
import { Schema, Model, postStatus } from "#constants";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Product = Model("Product", productSchema);
```
Sonra `models/index.js` barrel-ə əlavə et:
```js
export { Product } from "./product.model.js";
```
Enum-lar `constants/shared/enums.js`-dədir (məs. `postStatus`) — yeni enum
lazımdırsa oraya əlavə et.

### Addım 2 — Controller (`server/controllers/productController.js`)
`postController.js`-i şablon götür. Bütün handler-lər `asyncHandler` ilə bükülür
(`#utils`), cavablar `{ success, message, data }` zərfindədir.
```js
import { Product } from "#models";
import { asyncHandler } from "#utils";

const listProducts = asyncHandler(async (req, res) => { /* ... */ });
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body });
  res.status(201).json({ success: true, message: "Product created", data: { product } });
});

export { listProducts, createProduct };
```
`controllers/index.js` barrel:
```js
export * as productController from "./productController.js";
```

### Addım 3 — Route (`server/routes/productRoutes.js`)
`postRoutes.js`-i kopyala. Public GET-lər açıq, write əməliyyatları
`authenticate` + `writeRateLimiter` ilə qorunur:
```js
import { Router } from "#constants";
import { productController } from "#controllers";
import { authenticate, writeRateLimiter } from "#middlewares";

const ProductRouter = Router();
ProductRouter.get("/", productController.listProducts);
ProductRouter.post("/", authenticate, writeRateLimiter, productController.createProduct);
export { ProductRouter };
```
`routes/index.js` barrel:
```js
export { ProductRouter } from "./productRoutes.js";
```

### Addım 4 — `app.js`-də qeydiyyat
`setupRoutes` funksiyasına əlavə et:
```js
app.use("/api/products", ProductRouter);
```
Və yuxarıdakı import-a `ProductRouter`-i əlavə et (`import { AuthRouter, PostRouter, ProductRouter } from "#routes";`).

### Addım 5 — (Lazım olsa) Service
Ağır biznes məntiqi üçün `services/`-də class service yarat (`static` metodlar,
`FileService`/`HashService` üslubunda) və `services/index.js`-ə əlavə et.

> **Servis nümunələri:** `HashService` (bcrypt), `AuthTokenService` (JWT),
> `EncryptionService` (AES-256-GCM + slug), `FileService` (upload validasiya),
> `MailService` (nodemailer), `SocketService` (real-time room-lar).

---

## 7. Client-ə yeni səhifə/slice/api/komponent əlavə etmək

Client tərəf **RTK Query** (`store/api/*`) + **authSlice** (`store/slices`) üzərində
qurulub. Yeni resurs üçün ardıcıllıq: **api slice → səhifə → route → (komponent)**.

### 7.1. API slice (`postApi.js` referans)
`postApi.js` yeni resurs üçün copy-paste referansıdır. `baseApi.injectEndpoints`
ilə inject olunur, `providesTags`/`invalidatesTags` ilə cache idarə olunur.
```js
// store/api/productApi.js
import { baseApi } from './baseApi'

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params = {}) => ({ url: '/products', params }),
      providesTags: [{ type: 'Post', id: 'LIST' }], // öz tag tipini əlavə et
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/products', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const { useGetProductsQuery, useCreateProductMutation } = productApi
```
Yeni `tagType` üçün `baseApi.js`-dəki `tagTypes: ['User', 'Post', 'Auth']`
massivinə əlavə et. Sonra `store/api/index.js`-ə `export * from './productApi'`.

### 7.2. Səhifə + route

**React (`client-react`):** `src/pages/dashboard/`-a yeni qovluq (`ProductsPage/`)
əlavə et, sonra `routes/DashboardRouter.jsx`-də route qeyd et:
```jsx
<Route path="products" element={<ProductsPage />} />
```
Route qrupları lazy-load olunur (`AppRouter.jsx` → `PublicRouter`/`DashboardRouter`).
Qorunan səhifə üçün `ProtectedRoute` (rol yoxlaması `allowedRoles` ilə).

**Next (`client-next`):** App Router fayl-əsaslıdır. Yeni səhifə üçün sadəcə fayl
yarat:
```
src/app/(protected)/dashboard/products/page.js
```
Route qorunması `middleware.js`-in `matcher`-i ilə (`/dashboard/:path*`) avtomatik
işləyir. `PostsPage` (`dashboard/posts/page.js`) tam CRUD nümunəsidir — kopyala.
İnteraktiv səhifələr `'use client'` ilə başlamalıdır.

### 7.3. Komponent
Hazır UI kit `src/components/ui/`-dədir (`Button`, `Input`, `Card`, `Modal`,
`Table`, `Badge`, `Select`, `Textarea`, ...) və barrel-dən import olunur:
```jsx
import { Button, Card, Modal, Table } from '@/components/ui'   // Next
import { Button, Card, Modal, Table } from '@components/ui'    // React
```
React-da alias-lar `vite.config.js` + `jsconfig.json`-dadır (`@`, `@components`,
`@pages`, `@store`, `@layouts`, ...). Next-də yalnız `@/*` → `src/*`.

---

## 8. Deployment qeydləri

### 8.1. Server (Node)
- **Mühit:** `NODE_ENV=production` təyin et. Bu, `validateEnv()`-i işə salır —
  əgər `ACCESS_SECRET_KEY`/`REFRESH_SECRET_KEY`/`ENCRYPTION_KEY` default dəyərdədirsə
  və ya `MONGODB_URI` yoxdursa proses `process.exit(1)` ilə **dayanır**.
- **İşə salma:** `pnpm start` (`node app.js`). Prosesi canlı saxlamaq üçün **pm2**:
  ```bash
  pm2 start app.js --name myapp-server --env production
  pm2 save && pm2 startup
  ```
- **Reverse proxy:** `app.set("trust proxy", 1)` təyin edilib — nginx/Apache
  arxasında rate-limiting düzgün işləyir. HTTPS-i proxy səviyyəsində qur.
- **`.env`:** production `.env`-i serverdə saxla (repo-ya qoyma). `SMTP_*`
  dolu olmalıdır, əks halda OTP e-poçtları göndərilməz.
- **`uploads/`:** `FileService` fayları `uploads/` altına yazır — bu qovluq
  yazıla bilən və (əgər lazımdırsa) davamlı disk-də olmalıdır.

### 8.2. client-react (statik SPA)
- **Build:** `pnpm build` → `dist/`. Nəticə tam statik-dir.
- **Vercel / statik host:** `vercel.json` artıq SPA fallback rewrite ilə gəlir:
  `{ "source": "/(.*)", "destination": "/" }` — bütün route-lar `index.html`-ə
  yönləndirilir (react-router client-side routing üçün vacib). Netlify-də ekvivalenti
  `_redirects` faylı (`/* /index.html 200`).
- **Env:** `VITE_API_URL` (və `VITE_SITE_URL`) build zamanı inline olunur — host-un
  environment variables bölməsində build-dən əvvəl təyin et.

### 8.3. client-next (SSR)
- **Vercel (tövsiyə):** repo-nu bağla, root-u `client` (Next qovluğu) seç.
  `NEXT_PUBLIC_API_URL` və `NEXT_PUBLIC_SITE_URL`-i Vercel env-də təyin et.
  `sitemap.js`/`robots.js`/`middleware.js` avtomatik işləyir.
- **Öz Node serverin:** `pnpm build && pnpm start` (default port `3000`).
  pm2 ilə saxla; qarşısına nginx qoy. `next.config.mjs` təhlükəsizlik
  başlıqlarını (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`) hər route-a tətbiq edir.
- **Şəkillər:** `next.config.mjs`-də `images.remotePatterns` hazırda `hostname: '**'`
  (hamısına açıq) — production-a çıxmazdan əvvəl real CDN host-una daralt.

> Backend və frontend **ayrı** deploy olunur. Frontend host-unun URL-i backend-in
> `CLIENT_URL`/`corsConfig`-inə uyğun olmalıdır, əks halda CORS bloklayar.
