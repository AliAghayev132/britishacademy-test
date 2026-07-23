# 02 — Qovluq strukturu (Folder Structure)

Bu sənəd hər üç şablonun **real fayl ağacını** (annotasiyalı) təqdim edir. Hər qovluq üçün: bir sətirlik
məqsəd və "fayl bura nə vaxt qoyulur" qaydası. Ağaclar `node_modules/`, `.git/`, `dist/`, `.next/`,
`uploads/` istisna edilməklə diskdən çıxarılıb.

---

## 1. `server/` — Express + Mongoose backend

```
server/
├── app.js                      # Tətbiqin giriş nöqtəsi: middleware setup, route qeydiyyatı,
│                               #   servis init, Socket.IO, graceful shutdown
├── package.json                # Deps + "imports" (# alias map) + scripts (dev/start/lint/format)
├── eslint.config.js            # Flat ESLint konfiqi (Node globals)
├── .prettierrc                 # Prettier qaydaları (semi, double quote, printWidth 80)
├── .env.example                # Bütün environment dəyişənlərinin şablonu
│
├── config/                     # Mərkəzi konfiqurasiya (env oxunması burada baş verir)
│   ├── index.js                #   barrel → export * from './config.js'
│   └── config.js               #   config, corsConfig, securityConfig obyektləri
│
├── constants/                  # Dəyişməz dəyərlər və Mongoose/Express re-export-ları
│   ├── index.js                #   barrel → export * from './shared/index.js'
│   └── shared/
│       ├── index.js            #   enums + paths + variables barrel-i
│       ├── enums.js            #   userRoles, accountStatus, postStatus, otpTypes
│       ├── paths.js            #   uploadPaths (uploads/, uploads/avatars, uploads/posts)
│       └── variables.js        #   Schema, Model, Router helper-ləri (mongoose/express sarğısı)
│
├── lib/                        # Bütün xarici (npm + node built-in) modulların TƏK barrel-i
│   └── index.js                #   http, fs, path, crypto, cors, helmet, express, jwt, mongoose...
│
├── middlewares/                # Express middleware-lər
│   ├── index.js                #   barrel → auth + security + sanitize
│   ├── auth.js                 #   authenticate, authenticateRefreshToken, authenticateResetToken,
│   │                           #     requireRole
│   ├── security.js             #   rate limiter-lər, securityHeaders, noCookies
│   └── sanitize.js             #   sanitizeInput (NoSQL injection təmizləyici)
│
├── models/                     # Mongoose schema + model-lər
│   ├── index.js                #   barrel → User, OTP, Post
│   ├── user.model.js           #   User schema (role, status, tokenVersion, soft delete)
│   ├── otp.model.js            #   OTP schema (TTL index, statics: createOTP/verifyOTP)
│   └── post.model.js           #   Post schema (REFERANS model: virtual, static, method, pre-hook)
│
├── controllers/                # HTTP handler-lər (asyncHandler ilə bükülür)
│   ├── index.js                #   export * as authController / export * as postController
│   ├── authController.js       #   register, verifyOTP, login, refresh, logout, profile, avatar...
│   └── postController.js       #   listPosts, getPost, createPost, updatePost, deletePost
│
├── routes/                     # Express Router qeydiyyatı (URL → middleware → controller)
│   ├── index.js                #   barrel → AuthRouter, PostRouter
│   ├── authRoutes.js           #   /api/auth/* marşrutları
│   └── postRoutes.js           #   /api/posts/* marşrutları
│
├── services/                   # Biznes məntiqi / xarici sistem inteqrasiyaları (class-based)
│   ├── index.js                #   barrel → bütün servislər
│   ├── AuthTokenService.js     #   JWT sign/verify (access/refresh/reset)
│   ├── HashService.js          #   bcrypt hash/compare
│   ├── EncryptionService.js    #   AES-256-GCM, sha256, slug generasiyası
│   ├── MailService.js          #   nodemailer sarğısı (sendOTP, sendWelcome)
│   ├── FileService.js          #   yüklənən faylların validasiya + saxlanması
│   ├── SocketService.js        #   Socket.IO singleton (room-based real-time)
│   ├── MongoDBService.js       #   tək mongoose bağlantı singleton-u
│   └── BootstrapService.js     #   ilk boot-da default admin yaradır
│
├── templates/                  # HTML email şablonları
│   ├── index.js                #   barrel → baseTemplate, otpTemplate, welcomeTemplate
│   ├── baseTemplate.js         #   ümumi HTML layout
│   ├── otpTemplate.js          #   OTP kodu email-i
│   └── welcomeTemplate.js      #   xoş gəldin email-i
│
├── utils/                      # Kiçik, saf köməkçilər
│   ├── index.js                #   barrel → asyncHandler, ok, fail
│   ├── asyncHandler.js         #   async controller wrapper
│   └── apiResponse.js          #   ok()/fail() envelope köməkçiləri
│
├── scripts/                    # Birdəfəlik/CLI skriptlər
│   └── resetDatabase.js        #   bütün kolleksiyaları təmizləyir (yalnız dev/test)
│
└── uploads/                    # Yüklənən faylların runtime saxlama yeri (git-ignore olunur)
```

### Server: "fayl bura nə vaxt qoyulur" qaydaları

| Qovluq | Qayda |
| --- | --- |
| `lib/` | Yeni npm və ya node built-in modul lazımdırsa, əvvəlcə **onu buraya re-export et**, sonra `#lib`-dən import et. Birbaşa `import x from 'paket'` yazma. |
| `config/config.js` | Environment-dən oxunan hər dəyər (URL, gizli açar, limit). Kodun içində `process.env.*`-i səpələmə. |
| `constants/shared/` | enum-lar (`enums.js`), yol sabitləri (`paths.js`), mongoose/express sarğıları (`variables.js`). |
| `models/` | Yeni resurs sxemi. `post.model.js`-i şablon kimi kopyala (virtual/static/method/pre-hook nümunələri). |
| `controllers/` | HTTP-yə aid məntiq (req/res). Hər handler `asyncHandler` ilə bükülməlidir. Ağır biznes məntiqini `services/`-ə çıxar. |
| `services/` | Yenidən istifadə olunan biznes məntiqi və ya xarici sistem (DB, mail, socket, fayl, crypto). Class + static metod nümunəsini izlə. |
| `routes/` | Yalnız URL→middleware→controller əlaqəsi. Məntiq yazma. Yeni router-i `routes/index.js`-də və `app.js`-də qeyd et. |
| `middlewares/` | Bir neçə marşrutda təkrar olunan request-öncəsi məntiq (auth, rate limit, sanitize). |
| `templates/` | HTML email məzmunu. Yeni email tipi → yeni fayl + `index.js`-də export. |
| `utils/` | Yan-effektsiz kiçik köməkçilər (state saxlamayan). |
| `scripts/` | `node scripts/x.js` ilə əl ilə işlədilən əməliyyatlar. |

---

## 2. `client-react/` — Vite SPA (React 19 + react-router 8)

```
client-react/
├── index.html                  # Vite giriş HTML-i (#root)
├── vite.config.js              # Vite konfiqi: react + tailwind plugin, manualChunks, @ alias-ları
├── jsconfig.json               # Editor üçün @ path alias-ları (vite.config ilə sinxron)
├── eslint.config.js            # Flat ESLint (react-hooks, react-refresh)
├── vercel.json                 # SPA fallback rewrite (bütün yollar → /)
├── .env.example                # VITE_API_URL
├── public/                     # Statik aktivlər (vite.svg)
└── src/
    ├── main.jsx                # createRoot → <App />
    ├── App.jsx                 # Provider iyerarxiyası: Helmet → Redux → Socket → Router
    ├── App.css                 # Qlobal stillər / Tailwind import
    │
    ├── components/             # Yenidən istifadə olunan UI (səhifəyə bağlı olmayan)
    │   ├── index.js            #   barrel → SEO, ProtectedRoute, ui/*
    │   ├── SEO.jsx             #   react-helmet-async ilə <head> meta tag-ları
    │   ├── ProtectedRoute.jsx  #   auth/role route guard
    │   └── ui/                 #   dizayn sistemi primitivləri (Button, Input, Card, Table...)
    │       ├── index.js        #     bütün ui komponentlərinin barrel-i
    │       └── *.jsx           #     Badge, Button, Card, Checkbox, CustomSelect, Input, Modal,
    │                           #       PageLoader, Radio, Select, StatCard, Table, Textarea
    │
    ├── layouts/                # Səhifə qabığı (shell) komponentləri
    │   ├── index.js            #   barrel → PublicLayout, DashboardLayout
    │   ├── PublicLayout.jsx    #   marketinq header/footer + <Outlet/>
    │   └── DashboardLayout.jsx #   collapsible sidebar + header + <Outlet/>
    │
    ├── pages/                  # Marşruta bağlı ekranlar (hər səhifə öz qovluğunda)
    │   ├── index.js            #   yuxarı səviyyə barrel
    │   ├── public/             #   HomePage, LoginPage, RegisterPage, NotFoundPage
    │   │   └── <Page>/         #     <Page>.jsx + index.js (barrel)
    │   └── dashboard/          #   DashboardPage, PostsPage, ProfilePage
    │       └── <Page>/         #     <Page>.jsx + index.js (barrel)
    │
    ├── routes/                 # react-router konfiqi
    │   ├── index.js            #   barrel
    │   ├── AppRouter.jsx       #   BrowserRouter + lazy public/dashboard router-ləri
    │   ├── PublicRouter.jsx    #   public marşrutlar
    │   └── DashboardRouter.jsx #   ProtectedRoute ilə qorunan dashboard marşrutları
    │
    ├── store/                  # Redux Toolkit + RTK Query + Socket
    │   ├── index.js            #   configureStore (api reducer + auth reducer)
    │   ├── api/                #   RTK Query
    │   │   ├── index.js        #     barrel → baseApi + feature endpoint-ləri
    │   │   ├── baseApi.js      #     createApi + baseQueryWithReauth
    │   │   ├── authApi.js      #     /auth endpoint-ləri (injectEndpoints)
    │   │   └── postApi.js      #     /posts endpoint-ləri (injectEndpoints)
    │   ├── slices/             #   klassik redux state
    │   │   └── authSlice.js    #     auth (localStorage-backed)
    │   ├── context/            #   React Context provider-ləri
    │   │   ├── index.js        #     barrel → SocketProvider, useSocket
    │   │   └── SocketContext.jsx
    │   └── hooks/              #   xüsusi hook-lar
    │       ├── index.js        #     barrel → useRoomSocket
    │       └── useRoomSocket.js
    │
    ├── constants/              # Frontend sabitləri (server enum-ları ilə sinxron)
    │   └── index.js            #   statusOptions, roleOptions, statusBadgeVariant
    │
    └── utils/                  # Saf köməkçilər
        ├── index.js            #   barrel → formatDate, imageHandle
        ├── formatDate.js       #   date-fns formatlaması
        ├── imageHandle.js      #   şəkil URL köməkçiləri
        └── README.md           #   qovluğa aid lokal qeyd
```

### client-react: "fayl bura nə vaxt qoyulur" qaydaları

| Qovluq | Qayda |
| --- | --- |
| `components/ui/` | Səhifəyə bağlı olmayan, təkrar istifadə olunan dizayn primitivi (Button, Input...). Yeni primitiv → `index.js`-də export. |
| `components/` (kök) | Bir neçə səhifədə işlənən, amma ui-primitiv olmayan komponent (SEO, ProtectedRoute). |
| `layouts/` | Bir çox marşrutu bürüyən qabıq (sidebar/header + `<Outlet/>`). |
| `pages/` | Konkret marşruta bağlı ekran. Hər səhifə `pages/<qrup>/<Ad>/<Ad>.jsx + index.js` strukturunu izləyir. |
| `store/api/` | Yeni backend resursu → `xApi.js` faylı (`injectEndpoints`) + `store/api/index.js`-də export. |
| `store/slices/` | Server-cache olmayan client state (auth kimi). RTK Query cache-ni burada saxlama. |
| `store/context/` | Bütün ağaca lazım olan, Redux-a uyğun gəlməyən state (socket bağlantısı). |
| `store/hooks/` | Yenidən istifadə olunan davranışlı xüsusi hook (`useRoomSocket`). |
| `constants/` | Statik seçim siyahıları/xəritələr. Server `enums.js` ilə sinxron saxla. |
| `utils/` | State saxlamayan saf funksiyalar. |

---

## 3. `client-next/` — Next.js 16 App Router

```
client-next/
├── package.json                # Deps + scripts (dev/build/start/lint)
├── next.config.mjs             # poweredByHeader:false, security headers(), images.remotePatterns
├── middleware.js               # Edge auth guard (token cookie yoxlanışı)
├── jsconfig.json               # @/* → ./src/* alias-ı
├── eslint.config.mjs           # eslint-config-next flat config
├── postcss.config.mjs          # @tailwindcss/postcss plugin-i
├── pnpm-workspace.yaml         # allowBuilds: sharp, unrs-resolver
├── .env.example                # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL
└── src/
    ├── app/                    # App Router (fayl-əsaslı routing)
    │   ├── layout.js           #   root layout + qlobal metadata + <Providers>
    │   ├── providers.jsx       #   'use client': Redux + Socket provider-ləri
    │   ├── loading.js          #   qlobal Suspense fallback
    │   ├── error.js            #   qlobal error boundary ('use client')
    │   ├── not-found.js        #   404 səhifəsi
    │   ├── robots.js           #   /robots.txt generatoru
    │   ├── sitemap.js          #   /sitemap.xml generatoru
    │   ├── (public)/           #   route group: public səhifələr (URL-də görünmür)
    │   │   ├── page.js         #     ana səhifə (/)
    │   │   ├── login/page.js   #     /login
    │   │   └── register/page.js#     /register
    │   └── (protected)/        #   route group: qorunan səhifələr
    │       └── dashboard/
    │           ├── layout.js   #     dashboard shell (DashboardSidebar) + noindex metadata
    │           ├── page.js     #     /dashboard
    │           ├── posts/page.js
    │           └── profile/page.js
    │
    ├── components/             # Client/Server komponentləri
    │   ├── index.js            #   barrel → ui/*, JsonLd, DashboardSidebar
    │   ├── DashboardSidebar.jsx#   'use client': animasiyalı sidebar qabığı
    │   ├── JsonLd.jsx          #   Server Component: schema.org JSON-LD <script>
    │   └── ui/                 #   dizayn primitivləri (client-react ilə eyni dəst)
    │       ├── index.js
    │       └── *.jsx           #   Badge, Button, Card, Checkbox, CustomSelect, Input, Modal,
    │                           #     PageLoader, Radio, Select, StatCard, Table, Textarea (+README.md)
    │
    ├── lib/                    # Framework-neytral köməkçilər
    │   └── seo.js              #   SITE_* sabitləri + buildMetadata() köməkçisi
    │
    ├── store/                  # Redux Toolkit + RTK Query + Socket (react ilə paralel)
    │   ├── index.js            #   configureStore
    │   ├── api/
    │   │   ├── index.js
    │   │   ├── baseApi.js      #   createApi + baseQueryWithReauth (NEXT_PUBLIC_API_URL)
    │   │   ├── authApi.js
    │   │   └── postApi.js
    │   ├── slices/
    │   │   └── authSlice.js    #   SSR-safe + token cookie mirror
    │   └── context/
    │       └── SocketContext.jsx  # 'use client'
    │
    └── styles/
        └── globals.css         # Tailwind v4 (@import "tailwindcss") + baza stillər
```

### client-next: "fayl bura nə vaxt qoyulur" qaydaları

| Qovluq / fayl | Qayda |
| --- | --- |
| `app/(qrup)/.../page.js` | Yeni marşrut = yeni `page.js`. `(public)` / `(protected)` qrupları URL-ə təsir etmir, yalnız təşkilat + layout paylaşımı üçündür. |
| `app/.../layout.js` | Alt-ağacı bürüyən qabıq. Server Component olaraq saxla; client davranış lazımdırsa `'use client'` alt-komponentə çıxar. |
| `app/providers.jsx` | Bütün ağaca lazım olan client provider-lər (Redux, Socket). Root layout Server Component qalsın. |
| `app/robots.js`, `sitemap.js` | Next.js metadata route konvensiyaları — SEO faylları buraya. |
| `components/ui/` | Səhifəyə bağlı olmayan primitiv. İnteraktivlik lazımdırsa `'use client'`. |
| `components/` (kök) | Paylaşılan komponent. `JsonLd` kimi statik olanlar Server Component qala bilər. |
| `lib/` | Framework-neytral köməkçilər (məs. `buildMetadata`). |
| `store/` | client-react ilə eyni qaydalar (bax yuxarı), lakin bütün store faylları client-də işləyir; `authSlice` SSR-safe yazılmalıdır (`typeof window` yoxlaması). |
| `middleware.js` | Edge-də işləyən route qorunması. Yalnız `token` cookie-nin varlığını yoxlayır; ağır məntiq yazma. |
| `styles/` | Qlobal CSS. Tailwind v4 tamamilə CSS-də (`@import "tailwindcss"`) konfiqurasiya olunur. |

---

## 4. Üç şablon arasında paralellik

| Anlayış | server | client-react | client-next |
| --- | --- | --- | --- |
| Giriş nöqtəsi | `app.js` | `src/main.jsx` → `App.jsx` | `src/app/layout.js` |
| Barrel pattern | hər qovluqda `index.js` | hər qovluqda `index.js` | store/components-də `index.js` |
| Alias | `#` (package.json imports) | `@` (vite + jsconfig) | `@/*` (jsconfig) |
| Auth state | `req.user` (middleware) | `authSlice` (redux+localStorage) | `authSlice` (+token cookie) |
| Route guard | `authenticate` middleware | `<ProtectedRoute>` | `middleware.js` |
| Real-time | `services/SocketService.js` | `store/context/SocketContext.jsx` | `store/context/SocketContext.jsx` |

> Bəzi qovluqlarda (`client-react/src/utils/`, `client-*/src/components/ui/`) qovluğa aid lokal
> `README.md` faylı var; bunlar sənədləşdirmə qeydləridir, koda təsir etmir.
