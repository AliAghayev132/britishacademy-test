# 09 — Transfer Qeydləri (toask → şablon CHANGELOG)

Bu sənəd **hansı core sistemin** iki `toask` klonundan (`toask.co-server` və
`toask.co-client`) `fullstack-starter` şablonuna köçürüldüyünü və **necə
genericləşdirildiyini** sənədləşdirir. Mənbə:
`C:/Users/aghay/Desktop/Projects/template/toask/`.

Şablonun ümumi domeni: **User + OTP + Post** (toask-ın Admin/SuperAdmin/Company/
Feedback/Ticket domeni əvəzinə).

---

## 1. Server — infrastruktur (dəyişməz saxlanan core)

### 1.1. `#` alias + barrel sistemi (`package.json` `imports`)

Node.js subpath `imports` xəritəsi demək olar birə-bir köçürülüb.

| toask | şablon | Qeyd |
|-------|--------|------|
| `#lib`, `#config`, `#services`, `#templates`, `#constants`, `#middlewares`, `#controllers`, `#routes`, `#models`, `#*` | eyni | Saxlanıb |
| — | `#utils` **(YENİ)** | Şablon `#utils` alias-ını əlavə etdi (`utils/index.js` barrel: `asyncHandler`, `apiResponse`). toask-da `#utils` alias yox idi. |

Hər qovluqda `index.js` barrel-i saxlanır (`models/index.js`, `services/index.js`,
`controllers/index.js`, `routes/index.js`, `middlewares/index.js`, `config/index.js`,
`constants/index.js`) — dəyişməz nümunə.

### 1.2. `lib/index.js` barrel

**Birə-bir eyni** — heç bir dəyişiklik yoxdur. Hər iki fayl eyni Node built-in-ləri
(`http`, `fs`, `path`, `crypto`) və npm paketlərini (`cors`, `helmet`, `express`,
`fileUpload`, `rateLimit`, `bcrypt`, `jwt`, `mongoose`, `nodemailer`, `dotenv`,
`compression`, `SocketServer`) re-export edir.

### 1.3. Class servisləri (`services/`)

| toask servisi | şablon | Necə transfer olunub |
|---------------|--------|----------------------|
| `HashService` | **saxlanıb** | Dəyişməz (bcrypt, saltRounds 12). |
| `AuthTokenService` | **saxlanıb** | Saxlanıb; payload `{ adminId/superAdminId }` → generic `{ id, role, tokenVersion }`. Reset token `purpose` yoxlaması saxlanıb. |
| `EncryptionService` | **saxlanıb** | AES-256-GCM + `hash` + `generateTrackingId` saxlanıb; `generateSlug` saxlanıb, lakin **genericləşdirilib** (`generateSlug(companyName)` → `generateSlug(text)`, Post slug hook üçün). |
| `FileService` | **saxlanıb** | Dəyişməz (MIME whitelist, path-traversal qoruması, anonim ad). |
| `MongoDBService` | **saxlanıb** | Dəyişməz singleton. |
| `MailService` | **saxlanıb (genericləşdirilib)** | Nodemailer wrapper saxlanıb; `sendOTP` saxlanıb; feedback/limit mail-ləri **DROP**; generic `sendWelcome` **ƏLAVƏ**. |
| `SocketService` | **saxlanıb (genericləşdirilib)** | Ticket-room → generic room (aşağıda 1.6). |
| `BootstrapService` | **çevrilib** | `bootstrapSuperAdmin` → `bootstrapAdmin` (aşağıda 1.5). |
| `OpenRouterService` | **DROP** | AI (OpenRouter) inteqrasiyası tamamilə silindi. |

### 1.4. `templates/` (e-poçt şablonları)

| toask | şablon |
|-------|--------|
| `baseTemplate.js` | saxlanıb |
| `otpTemplate.js` | saxlanıb |
| `feedbackNotificationTemplate.js` | **DROP** |
| `limitWarningTemplate.js` | **DROP** |
| — | `welcomeTemplate.js` **(YENİ)** |

### 1.5. Bootstrap: SuperAdmin → Admin

| toask (`bootstrapSuperAdmin`) | şablon (`bootstrapAdmin`) |
|-------------------------------|---------------------------|
| `SuperAdmin` modeli | `User` modeli |
| `role: "superadmin"` | `role: "admin"` |
| `SA_EMAIL` / `SA_PASSWORD` / `SA_FIRST_NAME` / `SA_LAST_NAME` env | `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` env |
| `superadmin@system.com` default | `admin@example.com` default |

İlk açılışda admin yoxdursa yaradılır — məntiq eynidir.

### 1.6. `SocketService`: ticket-room → generic room

| toask | şablon | İzah |
|-------|--------|------|
| `join:ticket` / `leave:ticket` (`ticketId`) | `join:room` / `leave:room` (`roomId`) | Room konsepsiyası genericləşdi |
| `Map<ticketId, ...>`, `{ type, id, ticketId }` | `Map<roomId, ...>`, `{ id, roomId }` | `userType` (admin/superadmin) izləməsi sadələşdi |
| `decoded.adminId \|\| decoded.superAdminId` | `decoded.id` | Auth payload generic |
| `emitNewMessage`, `emitTicketUpdate`, `emitStatusChange`, `emitToCompanyAdmins`, `emitToAllSuperAdmins` | `message:new`, `emitToRoom`, `emitToUser` | Ticket/company-ə xas emitter-lər **DROP**, generic room emitter-ləri saxlanıb |
| `message:read` | `typing:start/stop` + `message:new` | Domenə xas hadisələr generic hadisələrlə əvəzləndi |

### 1.7. Middlewares

toask iç-içə (`admin/`, `superadmin/`, `shared/`) middleware ağacını
**düzləşdirilmiş** üç fayla yığdı:

| toask | şablon | Necə |
|-------|--------|------|
| `middlewares/admin/authMiddleware.js` + `superadmin/superAdminMiddleware.js` | `middlewares/auth.js` | İki ayrı auth guard → generic `authenticate` + `authenticateRefreshToken` + `authenticateResetToken` + `requireRole(roles)` |
| `middlewares/shared/securityMiddleware.js` | `middlewares/security.js` | Saxlanıb (`apiRateLimiter`, `loginRateLimiter`, `writeRateLimiter`, `securityHeaders`, `noCookies`) |
| `middlewares/shared/sanitizeMiddleware.js` | `middlewares/sanitize.js` | Saxlanıb (`sanitizeInput`, NoSQL sanitizasiya) |
| `middlewares/admin/subscriptionMiddleware.js` | **DROP** | Abunəlik məntiqi silindi |

### 1.8. Auth vertical slice (Admin → User; OTP saxlanıb)

Bu şablonun **əsas transfer edilmiş biznes axını**dır.

| toask | şablon |
|-------|--------|
| `models/admin/admin.model.js` | `models/user.model.js` (firstName/lastName/email/password/phone/avatar/`role: [user, admin]`/status/`tokenVersion`/lastLogin/isDeleted) |
| `models/admin/otp.model.js` | `models/otp.model.js` — **saxlanıb** (TTL index, `createOTP`/`verifyOTP`, 6 rəqəm, 5 cəhd limiti, `otpTypes: [register, reset-password, verify-email]`) |
| `controllers/admin/authController.js` | `controllers/authController.js` |

Auth controller endpoint-ləri (hamısı saxlanıb, generic User üzərində):
`register` → OTP göndər, `verifyOTP` → istifadəçi yarat, `resendOTP`, `login`
(rememberMe), `refreshToken`, `logout` (tokenVersion++), `getMe`, `changePassword`,
`forgotPassword` / `verifyResetOTP` / `resetPassword` (3 addımlı reset), `updateProfile`,
`updateAvatar` (FileService upload). Cavab zərfi `{ success, message, data }` saxlanıb.

### 1.9. YENİ nümunə: Post CRUD

toask-da yox idi — şablona **referans (copy-paste) resurs** kimi əlavə olundu:
- `models/post.model.js` — compound index, virtual (`url`), static (`findPublished`),
  instance method (`incrementViews`), `pre("save")` slug hook, `toJSON: { virtuals }`.
- `controllers/postController.js` — `listPosts` (pagination + filter), `getPost`
  (view++), `createPost`, `updatePost` (owner/admin check), `deletePost` (soft delete).
- `routes/postRoutes.js` — public GET-lər + qorunan write-lar (`authenticate` +
  `writeRateLimiter`).

### 1.10. `config/config.js`

Struktur saxlanıb; brend `toask` → `starter` dəyişdi. Əsas fərqlər:

| toask | şablon |
|-------|--------|
| `siteName`, `DOMAIN=toask.co`, `COOKIE_DOMAIN` | `siteName: "Starter"`, `DOMAIN=localhost`, cookie prefiks `__starter_at/_rt` |
| `.env.example`: DB Atlas, `COOKIE_DOMAIN` | `.env.example`: `MONGODB_URI` + DB hissələri, `DEFAULT_ADMIN_*`, `SMTP_SECURE` **əlavə** |
| CORS `toask.co` origin-ləri | CORS generic `CLIENT_URL` + `${DOMAIN}` |
| `validateEnv` `anonim_*` default-ları | `validateEnv` `starter_*` default-ları |
| `app.js` banner "Toask.co", AZ mesajlar (`Endpoint tapılmadı`) | banner "Starter", İngiliscə mesajlar |

---

## 2. Client — RTK Query store

### 2.1. `baseApi` (baseQuery + reauth) — saxlanıb

`store/api/baseApi.js` **core-u dəyişməz** köçürülüb: `fetchBaseQuery` +
`prepareHeaders` (auth token əlavəsi) + `baseQueryWithReauth` (401-də bir dəfə
refresh cəhdi, uğursuzsa `auth/logout`). Yeganə fərq `tagTypes`: toask-ın domen
tag-ları → generic **`['User', 'Post', 'Auth']`**.

### 2.2. API slice-ləri

| toask (`store/api/`) | şablon |
|----------------------|--------|
| `authApi.js` | **saxlanıb** (generic `/api/auth` route-larına uyğun) |
| `feedbackApi.js` (referans slice) | **`postApi.js` ilə əvəzləndi** (yeni referans CRUD slice) |
| `adminApi`, `companyApi`, `contactApi`, `departmentApi`, `notificationApi`, `profileApi`, `reportApi`, `subscriptionApi`, `superAdminApi`, `teamApi`, `ticketApi` | **hamısı DROP** |

`postApi.js` `providesTags`/`invalidatesTags` ilə per-item + `LIST` tag pattern-ini
nümayiş etdirir — yeni resurs üçün şablon.

### 2.3. `authSlice` — `company` DROP, `role` əlavə

| toask `authSlice` | şablon `authSlice` |
|-------------------|--------------------|
| state: `user`, **`company`**, tokens, `userType` (`admin`\|`superadmin`) | state: `user`, tokens, **`role`** (`user`\|`admin`) |
| `setCredentials({ admin, company, tokens, userType })` | `setCredentials({ user, tokens })` |
| **`updateCompany`** reducer | **DROP** |
| `updateUser`, `setTokens`, `logout` | saxlanıb |
| localStorage `auth` blob | saxlanıb (`user`/`accessToken`/`refreshToken`/`role`) |

`company` anlayışı və `updateCompany` action tamamilə silindi; çoxsəviyyəli
`userType` sadə `role`-a endirildi.

### 2.4. Routing

| toask (`routes/`) | şablon |
|-------------------|--------|
| `AppRouter.jsx` | **saxlanıb** (lazy route qrupları, `BrowserRouter` + Suspense + PageLoader) |
| `AdminRouter.jsx` | **`DashboardRouter.jsx`** ilə əvəzləndi (`/dashboard/*`) |
| `SuperAdminRouter.jsx` | **DROP** |
| `PublicRouter.jsx` | saxlanıb (Home/Login/Register/NotFound) |
| `ProtectedRoute.jsx` | **saxlanıb** — guard `userType` → `role` (`allowedRoles`) genericləşdi |

### 2.5. `SocketContext` + hook

| toask | şablon |
|-------|--------|
| `store/context/SocketContext.jsx` (ticket helper-ləri: `join:ticket`, ...) | saxlanıb — generic room helper-ləri (`joinRoom`, `leaveRoom`, `startTyping`, `stopTyping`, `sendMessage`) |
| `store/hooks/useTicketSocket.js` | **`useRoomSocket.js`** ilə əvəzləndi |

Tək autentifikasiyalı Socket.IO bağlantısı (token/user dəyişəndə yenidən qurulur)
core-u dəyişməz saxlanıb.

### 2.6. SEO (React)

`components/SEO.jsx` (`react-helmet-async`) **saxlanıb**, brend `Starter`-ə dəyişdi.
Bax: `08-SEO.md`.

### 2.7. UI kit + utils — saxlanıb

`components/ui/*` (Badge, Button, Card, Checkbox, CustomSelect, Input, Modal,
PageLoader, Radio, Select, StatCard, Table, Textarea), `components/ProtectedRoute`,
`utils/formatDate`, `utils/imageHandle` dəyişməz köçürülüb. toask-a xas
`constants/categoryOptions.js` və export/xlsx utils-ları silinib.

---

## 3. Next.js stack — react-router → App Router

`client-next` toask-da **yox idi** — React SPA-dan portlanaraq yaradıldı.

| React (SPA) | Next (App Router) | Necə |
|-------------|-------------------|------|
| `react-router` (`AppRouter`/`PublicRouter`/`DashboardRouter`) | Fayl-əsaslı App Router (`app/(public)/`, `app/(protected)/dashboard/`) | Route qrupları qovluqlarla |
| `react-helmet-async` (`SEO.jsx`) | **Metadata API** (`lib/seo.js` `buildMetadata`, `metadata`/`generateMetadata` export-ları) | SSR SEO |
| `ProtectedRoute` (client guard) | **`middleware.js`** (cookie-mirror auth guard) | Edge middleware |
| `main.jsx` + `App.jsx` provider-ləri | **`app/providers.jsx`** (`'use client'`) + `app/layout.js` | Server/client ayrımı |
| — | **`app/sitemap.js`** (YENİ) | `/sitemap.xml` |
| — | **`app/robots.js`** (YENİ) | `/robots.txt` |
| — | **`components/JsonLd.jsx`** (YENİ) | Schema.org struktur data |
| — | **`next.config.mjs`** (YENİ) | Təhlükəsizlik başlıqları, image patterns |
| `authSlice` (localStorage) | `authSlice` + **cookie mirror** (`setTokenCookie`) | Middleware localStorage oxuya bilmədiyi üçün token `token` cookie-sinə güzgülənir; SSR-safe storage helper-ləri (`typeof window` guard) |

`baseApi`, `authApi`, `postApi`, `store`, `SocketContext` React versiyası ilə demək
olar eyni (yalnız `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`).

---

## 4. Silinən BÜTÜN biznes məntiqi

toask-dan şablona **köçürülməyən** domenlər (server + client):

- **feedback** — anonim feedback modeli/controller/route/api, IP log, feedback mail-ləri
- **company** — company modeli, controller, api, `authSlice.company`, `updateCompany`
- **department** — department modeli/controller/route/api
- **subscription** — subscription modeli/controller/middleware/api, limit warning mail
- **ticket** — ticket modeli/controller/route/api, ticket socket room-ları, `useTicketSocket`
- **partner** — partner modeli/controller, `getActivePartners` public endpoint
- **superadmin** — SuperAdmin modeli, bütün superadmin controller/route/middleware, SuperAdminRouter/Layout/səhifələr
- **AI (OpenRouter)** — `OpenRouterService`, `aiController`, AI suggestion komponentləri
- **report** — report modeli/controller/route
- **contact** — contactMessage modeli, contact controller/route/api
- **notification** — notification modeli/controller/route/api
- **analytics/dashboard (superadmin)** — analytics/dashboard controller-ləri və səhifələri
- **team** — team route/api və AdminTeamPage
- **export/xlsx** — `exportUtils`, `xlsx` asılılığı, export modal-ları

---

## 5. Asılılıq versiya artımları (toask → şablon)

### 5.1. Server (`package.json`)

`anonim-feedback-server` → `starter-server`.

| Paket | toask | şablon | Qeyd |
|-------|-------|--------|------|
| `nodemailer` | `^7.0.11` | `^9.0.3` | **MAJOR** (7→9) |
| `uuid` | `^13.0.0` | `^14.0.1` | **MAJOR** (13→14) |
| `mongoose` | `^9.0.1` | `^9.7.3` | minor |
| `helmet` | `^8.1.0` | `^8.2.0` | minor |
| `express-rate-limit` | `^8.2.1` | `^8.5.2` | minor |
| `cors` | `^2.8.5` | `^2.8.6` | patch |
| `dotenv` | `^17.2.3` | `^17.4.2` | minor |
| `validator` | `^13.15.23` | `^13.15.35` | patch |
| `express` | `^5.2.1` | `^5.2.1` | eyni |
| `bcryptjs` | `^3.0.3` | `^3.0.3` | eyni |
| `jsonwebtoken` | `^9.0.3` | `^9.0.3` | eyni |
| `socket.io` | `^4.7.5` | `^4.8.3` | minor |
| `compression` | `^1.8.1` | `^1.8.1` | eyni |
| `express-fileupload` | `^1.5.2` | `^1.5.2` | eyni |
| **devDeps** | | | |
| `eslint` | `^9.39.2` | `^10.6.0` | **MAJOR** (9→10) |
| `prettier` | `^3.8.1` | `^3.9.4` | minor |
| `nodemon` | `^3.1.11` | `^3.1.14` | patch |
| `eslint-config-prettier` | `^10.1.8` | `^10.1.8` | eyni |
| `eslint-plugin-import` | `^2.32.0` | `^2.32.0` | eyni |

### 5.2. Client — React (`client-react/package.json`)

toask client adı `newproject` → `starter-client-react`.

| Paket | toask | şablon | Qeyd |
|-------|-------|--------|------|
| `vite` | `^7.2.4` | `^8.1.3` | **MAJOR (7→8)** — Rolldown; `vite.config.js`-də `manualChunks` **funksiya** formasında olmalıdır |
| `react-router` | `^7.13.0` | `^8.1.0` | **MAJOR (7→8)** |
| `react-helmet-async` | `^2.0.5` | `^3.0.0` | **MAJOR (2→3)** |
| `lucide-react` | `^0.560.0` | `^1.23.0` | **MAJOR (0.x→1)** |
| `@vitejs/plugin-react` | `^5.1.1` | `^6.0.3` | **MAJOR (5→6)** |
| `eslint` | `^9.39.1` | `^10.6.0` | **MAJOR (9→10)** |
| `@eslint/js` | `^9.39.1` | `^10.0.1` | **MAJOR** |
| `react` / `react-dom` | `^19.2.0` | `^19.2.7` | patch |
| `@reduxjs/toolkit` | `^2.11.1` | `^2.12.0` | minor |
| `react-redux` | `^9.2.0` | `^9.3.0` | minor |
| `recharts` | `^3.7.0` | `^3.9.2` | minor |
| `framer-motion` | `^12.27.0` | `^12.42.2` | minor |
| `date-fns` | `^4.1.0` | `^4.4.0` | minor |
| `sweetalert2` | `^11.26.10` | `^11.26.25` | patch |
| `tailwindcss` / `@tailwindcss/vite` | `^4.1.18` | `^4.3.2` | minor |
| `globals` | `^16.5.0` | `^17.7.0` | **MAJOR** |
| `eslint-plugin-react-refresh` | `^0.4.24` | `^0.5.3` | minor |
| `axios` | `^1.13.2` | **SİLİNDİ** | RTK Query fetchBaseQuery istifadə olunur |
| `xlsx` | `^0.18.5` | **SİLİNDİ** | export funksiyası silindi |
| `socket.io-client` | `^4.8.3` | `^4.8.3` | eyni |

### 5.3. Client — Next.js (`client-next/package.json`)

**Tamamilə YENİ paket** (`starter-client-next`) — toask-da qarşılığı yoxdur.

| Paket | Versiya | Qeyd |
|-------|---------|------|
| `next` | `^16.2.10` | **YENİ — Next.js 16** |
| `eslint-config-next` | `^16.2.10` | YENİ |
| `eslint` | `^9` | (server/react-də 10, Next-də 9 qalıb) |
| `@tailwindcss/postcss` | `^4.3.2` | Vite plugin əvəzinə PostCSS |
| `react` / `react-dom` | `^19.2.7` | React ilə eyni |
| `@reduxjs/toolkit` `2.12.0`, `react-redux` `9.3.0`, `recharts` `3.9.2`, `framer-motion` `12.42.2`, `lucide-react` `1.23.0`, `socket.io-client` `4.8.3`, `sweetalert2` `11.26.25`, `clsx` `2.1.1`, `date-fns` `4.4.0` | React client ilə eyni | `react-router` və `react-helmet-async` **YOX** (App Router + Metadata API əvəzləyir) |

**Əsas major-lar (yekun):** Vite 7→8, react-router 7→8, Next.js 16-da **əlavə edildi**,
nodemailer 7→9, uuid 13→14, react-helmet-async 2→3, lucide-react 0→1, eslint 9→10
(server + react client).
