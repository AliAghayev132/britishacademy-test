# 04 — Kitabxanalar (Dependencies)

Bu sənəd hər üç şablonun `package.json`-undakı **DƏQİQ versiyaları** (diskdən oxunub) sadalayır. Hər
sətir üçün: versiya, nə üçündür, harada istifadə olunur (real fayl istinadı) və rəsmi sənəd linki.
Sonda hər şablon üçün versiya yeniləmə siyasəti (update policy) qeydi var.

> Bütün versiyalar `^` (caret) ilə yazılıb — minor/patch yenilənmələr icazəlidir, major dəyişikliklər deyil.

---

## 1. `server/` (starter-server 1.0.0)

### Runtime dependencies

| Paket | Versiya | Nə üçündür | Harada istifadə olunur | Sənəd |
| --- | --- | --- | --- | --- |
| `express` | ^5.2.1 | HTTP server / routing framework | `app.js`, `#lib`, bütün routes/controllers | https://expressjs.com |
| `mongoose` | ^9.7.3 | MongoDB ODM (schema/model) | `models/*.js`, `services/MongoDBService.js` | https://mongoosejs.com |
| `jsonwebtoken` | ^9.0.3 | JWT sign/verify | `services/AuthTokenService.js`, `middlewares/auth.js`, `services/SocketService.js` | https://github.com/auth0/node-jsonwebtoken |
| `bcryptjs` | ^3.0.3 | Parol hash (bcrypt, saf JS) | `services/HashService.js` | https://github.com/dcodeIO/bcrypt.js |
| `helmet` | ^8.2.0 | Təhlükəsizlik HTTP başlıqları (CSP...) | `app.js` → `setupSecurity` | https://helmetjs.github.io |
| `cors` | ^2.8.6 | CORS whitelist + credentials | `app.js`, `config/config.js` (`corsConfig`) | https://github.com/expressjs/cors |
| `express-rate-limit` | ^8.5.2 | Rate limiting (brute-force qoruma) | `middlewares/security.js` | https://express-rate-limit.mintlify.app |
| `express-fileupload` | ^1.5.2 | multipart/form-data fayl yükləmə | `app.js`, `services/FileService.js` | https://github.com/richardgirges/express-fileupload |
| `compression` | ^1.8.1 | gzip cavab sıxılması | `app.js` → `setupMiddlewares` | https://github.com/expressjs/compression |
| `nodemailer` | ^9.0.3 | SMTP email göndərmə | `services/MailService.js` | https://nodemailer.com |
| `socket.io` | ^4.8.3 | Real-time WebSocket server | `services/SocketService.js` | https://socket.io/docs/v4 |
| `dotenv` | ^17.4.2 | `.env` fayllarının yüklənməsi | `config/config.js`, `#lib` | https://github.com/motdotla/dotenv |
| `uuid` | ^14.0.1 | Unikal ID generasiyası | `#lib`-də re-export olunub; **hazırda birbaşa çağırılmır** (əlavə funksiyalar üçün mövcuddur) | https://github.com/uuidjs/uuid |
| `validator` | ^13.15.35 | String validasiyası (email, URL...) | **hazırda birbaşa çağırılmır**; əl ilə validasiya üçün ehtiyat kimi daxildir | https://github.com/validatorjs/validator.js |

### Dev dependencies

| Paket | Versiya | Nə üçündür | Harada | Sənəd |
| --- | --- | --- | --- | --- |
| `nodemon` | ^3.1.14 | Dev-də avtomatik yenidən başlatma | `package.json` `dev` script | https://github.com/remy/nodemon |
| `eslint` | ^10.6.0 | Linting | `eslint.config.js` | https://eslint.org |
| `prettier` | ^3.9.4 | Kod formatlama | `.prettierrc`, `format` script | https://prettier.io |
| `eslint-config-prettier` | ^10.1.8 | ESLint ilə Prettier ziddiyyətini söndürür | quraşdırılıb, lakin cari flat konfiqdə hələ qoşulmayıb | https://github.com/prettier/eslint-config-prettier |
| `eslint-plugin-import` | ^2.32.0 | Import sırası/həlli qaydaları | quraşdırılıb, lakin cari flat konfiqdə hələ qoşulmayıb | https://github.com/import-js/eslint-plugin-import |

---

## 2. `client-react/` (starter-client-react 0.0.0)

### Runtime dependencies

| Paket | Versiya | Nə üçündür | Harada istifadə olunur | Sənəd |
| --- | --- | --- | --- | --- |
| `react` | ^19.2.7 | UI kitabxanası | bütün `src/**/*.jsx` | https://react.dev |
| `react-dom` | ^19.2.7 | React-in DOM render-i | `src/main.jsx` (`createRoot`) | https://react.dev/reference/react-dom |
| `react-router` | ^8.1.0 | SPA client-side routing | `src/routes/*`, səhifə naviqasiyası | https://reactrouter.com |
| `@reduxjs/toolkit` | ^2.12.0 | State + RTK Query (data fetching) | `src/store/index.js`, `store/api/*`, `store/slices/authSlice.js` | https://redux-toolkit.js.org |
| `react-redux` | ^9.3.0 | React ↔ Redux bağlantısı | `src/App.jsx` (`Provider`), `useSelector`/`useDispatch` | https://react-redux.js.org |
| `socket.io-client` | ^4.8.3 | Real-time client | `src/store/context/SocketContext.jsx` | https://socket.io/docs/v4/client-api |
| `react-helmet-async` | ^3.0.0 | `<head>` meta idarəsi (SEO) | `src/App.jsx` (`HelmetProvider`), `src/components/SEO.jsx` | https://github.com/staylor/react-helmet-async |
| `recharts` | ^3.9.2 | Diaqram/qrafiklər | `src/pages/dashboard/DashboardPage/DashboardPage.jsx` | https://recharts.org |
| `framer-motion` | ^12.42.2 | Animasiyalar | `src/layouts/DashboardLayout.jsx` (`motion`, `AnimatePresence`) | https://www.framer.com/motion |
| `lucide-react` | ^1.23.0 | İkon dəsti | səhifələr/layout-lar (məs. `PostsPage`, `DashboardLayout`) | https://lucide.dev |
| `sweetalert2` | ^11.26.25 | Modal/alert dialoqları | `LoginPage`, `RegisterPage`, `PostsPage` (`Swal.fire`) | https://sweetalert2.github.io |
| `date-fns` | ^4.4.0 | Tarix formatlama | `src/utils/formatDate.js` | https://date-fns.org |
| `clsx` | ^2.1.1 | Şərti className birləşdirmə | `src/components/ui/*` (məs. `Button.jsx`) | https://github.com/lukeed/clsx |

### Dev dependencies

| Paket | Versiya | Nə üçündür | Harada | Sənəd |
| --- | --- | --- | --- | --- |
| `vite` | ^8.1.3 | Build tool / dev server (Rolldown) | `vite.config.js`, `dev`/`build` script | https://vite.dev |
| `@vitejs/plugin-react` | ^6.0.3 | Vite üçün React plugin-i | `vite.config.js` | https://github.com/vitejs/vite-plugin-react |
| `tailwindcss` | ^4.3.2 | Utility-first CSS | `src/App.css`, ui komponentləri | https://tailwindcss.com |
| `@tailwindcss/vite` | ^4.3.2 | Tailwind v4 Vite plugin-i | `vite.config.js` | https://tailwindcss.com/docs/installation/using-vite |
| `eslint` | ^10.6.0 | Linting | `eslint.config.js` | https://eslint.org |
| `@eslint/js` | ^10.0.1 | ESLint tövsiyə olunan qaydalar | `eslint.config.js` | https://eslint.org |
| `eslint-plugin-react-hooks` | ^7.1.1 | Hook qaydaları | `eslint.config.js` | https://www.npmjs.com/package/eslint-plugin-react-hooks |
| `eslint-plugin-react-refresh` | ^0.5.3 | Fast-refresh təhlükəsizliyi | `eslint.config.js` | https://github.com/ArnaudBarre/eslint-plugin-react-refresh |
| `globals` | ^17.7.0 | Qlobal dəyişən tərifləri | `eslint.config.js` | https://github.com/sindresorhus/globals |
| `@types/react` | ^19.2.17 | React tip tərifləri (editor) | JS type checking / IDE | https://www.npmjs.com/package/@types/react |
| `@types/react-dom` | ^19.2.3 | React DOM tip tərifləri | JS type checking / IDE | https://www.npmjs.com/package/@types/react-dom |

---

## 3. `client-next/` (starter-client-next 1.0.0)

### Runtime dependencies

| Paket | Versiya | Nə üçündür | Harada istifadə olunur | Sənəd |
| --- | --- | --- | --- | --- |
| `next` | ^16.2.10 | React framework (App Router, SSR) | `src/app/*`, `middleware.js`, `next.config.mjs` | https://nextjs.org/docs |
| `react` | ^19.2.7 | UI kitabxanası | bütün komponentlər | https://react.dev |
| `react-dom` | ^19.2.7 | DOM render-i | Next tərəfindən daxili | https://react.dev/reference/react-dom |
| `@reduxjs/toolkit` | ^2.12.0 | State + RTK Query | `src/store/*` | https://redux-toolkit.js.org |
| `react-redux` | ^9.3.0 | React ↔ Redux | `src/app/providers.jsx`, komponentlər | https://react-redux.js.org |
| `socket.io-client` | ^4.8.3 | Real-time client | `src/store/context/SocketContext.jsx` | https://socket.io/docs/v4/client-api |
| `recharts` | ^3.9.2 | Diaqramlar | `src/app/(protected)/dashboard/page.js` | https://recharts.org |
| `framer-motion` | ^12.42.2 | Animasiyalar | `src/components/DashboardSidebar.jsx` | https://www.framer.com/motion |
| `lucide-react` | ^1.23.0 | İkonlar | `DashboardSidebar.jsx`, `login/page.js` | https://lucide.dev |
| `sweetalert2` | ^11.26.25 | Modal/alert dialoqları | dashboard səhifələri | https://sweetalert2.github.io |
| `date-fns` | ^4.4.0 | Tarix formatlama | ui/util köməkçiləri | https://date-fns.org |
| `clsx` | ^2.1.1 | className birləşdirmə | `src/components/ui/*` | https://github.com/lukeed/clsx |

### Dev dependencies

| Paket | Versiya | Nə üçündür | Harada | Sənəd |
| --- | --- | --- | --- | --- |
| `tailwindcss` | ^4.3.2 | Utility-first CSS | `src/styles/globals.css` (`@import "tailwindcss"`) | https://tailwindcss.com |
| `@tailwindcss/postcss` | ^4.3.2 | Tailwind v4 PostCSS plugin-i | `postcss.config.mjs` | https://tailwindcss.com/docs/installation/using-postcss |
| `eslint` | ^9 | Linting | `eslint.config.mjs` | https://eslint.org |
| `eslint-config-next` | ^16.2.10 | Next.js flat ESLint konfiqi | `eslint.config.mjs` (core-web-vitals) | https://nextjs.org/docs/app/api-reference/config/eslint |
| `@types/react` | ^19.2.17 | React tipləri (editor) | IDE | https://www.npmjs.com/package/@types/react |
| `@types/react-dom` | ^19.2.3 | React DOM tipləri | IDE | https://www.npmjs.com/package/@types/react-dom |

> **Client-lər arasındakı fərq:** `client-next` `react-router` (App Router əvəz edir), `react-helmet-async`
> (Next `metadata` API-si əvəz edir) və `@tailwindcss/vite` (əvəzinə `@tailwindcss/postcss`) **saxlamır**.
> Qalan paketlər (@reduxjs/toolkit, react-redux, socket.io-client, recharts, framer-motion, lucide-react,
> sweetalert2, date-fns, clsx) hər iki clientdə **eyni versiyadadır**.

---

## 4. Versiya yeniləmə siyasəti (Update Policy)

Bu bir **şablondur**. Yeni layihə yaradanda paketləri o günün stabil versiyalarına yüksəltmək tövsiyə olunur:

```bash
# Hər qovluqda köhnəlmiş paketləri yoxla
pnpm outdated

# İnteraktiv yeniləmə (major daxil)
pnpm up --latest --interactive
```

Diqqət ediləcək məqamlar:

| Mövzu | Qeyd |
| --- | --- |
| **Cari major-lar** | Bu şablon artıq **Vite 8**, **react-router 8** və **Next 16** kimi cari major versiyalarda qurulub — geri qayıtmayın. |
| **React 19** | React 19 + `@types/react` 19 uyğun cütdür; birini yüksəldəndə digərini də yüksəldin. |
| **Tailwind v4** | v4 konfiqurasiyası tamamilə CSS-dədir (`@import "tailwindcss"`) — `tailwind.config.js` yoxdur. v3-ə geri qayıtmaq konfiqi tələb edər. |
| **Socket.IO cütlüyü** | `socket.io` (server) və `socket.io-client` (client) əsas versiyaları uyğun saxlanmalıdır (hazırda hər ikisi ^4.8.3). |
| **`xlsx` (SheetJS)** | Bu şablonlarda **yoxdur**, lakin Excel ixracı üçün əlavə edilərsə: npm registry-dəki `xlsx` **0.18.5**-də dondurulub (daha yeni buraxılışlar yalnız SheetJS-in öz CDN-indədir). `package.json`-da `"xlsx": "0.18.5"` kimi **dəqiq versiya** (caret olmadan) sabitləyin. |
| **`^` (caret)** | Şablondakı bütün asılılıqlar caret ilədir; `pnpm install` minor/patch-ləri avtomatik gətirir, amma reproduktivlik üçün `pnpm-lock.yaml`-ı commit edin. |
| **Qeyd olunan istifadəsiz paketlər** | `uuid` və `validator` serverdə quraşdırılıb, amma hazırda birbaşa çağırılmır — layihə üçün lazım deyilsə silə bilərsiniz. |
