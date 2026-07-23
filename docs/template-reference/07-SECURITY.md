# 07 — Təhlükəsizlik (Server)

Bu sənəd `server/` paketinin **real olaraq tətbiq edilmiş** təhlükəsizlik yığınını
təsvir edir. Bütün istinadlar həqiqi fayllara aiddir: `app.js`,
`middlewares/security.js`, `middlewares/sanitize.js`, `middlewares/auth.js`,
`config/config.js`.

Təhlükəsizlik middleware-ləri `app.js`-də bu ardıcıllıqla qoşulur:
`setupSecurity()` → `setupMiddlewares()` → `setupRoutes()` → `setupErrorHandlers()`.

---

## 1. Helmet (təhlükəsizlik başlıqları)

`app.js` → `setupSecurity()` daxilində Helmet CSP ilə konfiqurasiya olunub:

```js
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
})
```

- **`defaultSrc 'self'`** — resurslar default olaraq yalnız öz origin-dən.
- **`styleSrc` `'unsafe-inline'`** — inline style-lara icazə (Tailwind/inline üçün).
  Sərtləşdirmək istəsən nonce-based CSP-yə keç.
- **`scriptSrc 'self'`** — kənar script bloklanır (XSS səthini azaldır).
- **`imgSrc`** — `data:` URI, istənilən `https:` və lokal dev host-a şəkil icazəsi.
  Production-da `http://localhost:*`-i çıxarmaq tövsiyə olunur.
- **`crossOriginResourcePolicy: cross-origin`** — `/uploads` statik fayllarının
  fərqli origin-dəki frontend tərəfindən yüklənməsinə imkan verir.

---

## 2. Rate limiting (`middlewares/security.js`)

Üç ayrı limiter `express-rate-limit` ilə. Hamısı `standardHeaders: true`,
`legacyHeaders: false` (müasir `RateLimit-*` başlıqları).

| Limiter | Pəncərə | Limit | Harada | Məqsəd |
|---------|---------|-------|--------|--------|
| `apiRateLimiter` | 1 dəqiqə | 100 sorğu / IP | `app.js`: `app.use("/api", apiRateLimiter)` | Ümumi API flood qoruması |
| `loginRateLimiter` | 15 dəqiqə | 10 cəhd / IP | `authRoutes.js`: `POST /login` | Brute-force parol qoruması |
| `writeRateLimiter` | 15 dəqiqə | 50 yazı / IP | `postRoutes.js`: `POST/PUT/DELETE` | Write (create/update/delete) abuse qoruması |

Limit aşıldıqda `{ success: false, message: "..." }` cavabı qayıdır. Proxy
arxasında düzgün IP üçün `app.set("trust proxy", 1)` (`app.js`) təyin edilib.

Yeni write route-larına `writeRateLimiter`, həssas auth endpoint-lərinə
`loginRateLimiter` əlavə etməyi unutma.

---

## 3. NoSQL injection sanitizasiyası (`middlewares/sanitize.js`)

`sanitizeInput` middleware-i `app.js`-də body parser-lərdən **sonra** qoşulur və
`req.body`, `req.query`, `req.params`-ı rekursiv təmizləyir:

- **`$` ilə başlayan açarlar silinir** — MongoDB operatorları (`$gt`, `$ne`,
  `$where` və s.) inject olunmasının qarşısını alır.
- Massivlər və iç-içə obyektlər rekursiv gəzilir (`sanitize`).
- Təmizləmə **yerində** (`sanitizeInPlace`) baş verir — orijinal obyektin
  açarları silinib təmiz variantla əvəz olunur (Express 5 read-only `req.query`
  ilə uyğunluq üçün).

Praktik nəticə: `{ email: { $ne: null } }` kimi yük serverə çatanda `$ne` açarı
atılır, beləliklə operator-injection query-ə düşmür.

---

## 4. CORS whitelist (`config/config.js` → `corsConfig`)

CORS **whitelist əsaslıdır** və mühitə görə dəyişir:

```js
const corsConfig = {
  origin: isProduction
    ? [process.env.CLIENT_URL, `https://www.${domain}`, `https://${domain}`].filter(Boolean)
    : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true,
}
```

- **Production:** yalnız `CLIENT_URL` və `https://[www.]${DOMAIN}` origin-lərinə icazə.
  `.filter(Boolean)` təyin olunmamış dəyərləri atır.
- **Development:** Vite (`5173`), Next (`3000`) və `127.0.0.1:5173`.
- **`credentials: true`** — cookie/authorization başlıqlarının ötürülməsinə imkan.
- Eyni `corsConfig.origin` **Socket.IO**-da da istifadə olunur (`SocketService.init`),
  beləliklə real-time qat da eyni whitelist-lə qorunur.

---

## 5. JWT + `tokenVersion` (bütün cihazlardan çıxış)

Autentifikasiya `middlewares/auth.js` + `services/AuthTokenService.js` üzərindədir.

**Token növləri (`AuthTokenService`):**
- **Access token** — 15 dəqiqə, `ACCESS_SECRET_KEY` ilə imzalanır.
- **Refresh token** — 7 gün (rememberMe-də 30 gün), `REFRESH_SECRET_KEY` ilə.
- **Reset token** — 10 dəqiqə, `ENCRYPTION_KEY` ilə imzalanır və `purpose:
  "reset-password"` daşıyır (`verifyResetToken` bu purpose-u yoxlayır).

**Payload formatı:** `{ id, role, tokenVersion }`.

**`tokenVersion` mexanizmi (əsas təhlükəsizlik xüsusiyyəti):**
- Hər `User` sənədində `tokenVersion` (default `0`) sahəsi var.
- `authenticate` middleware-i token-dəki `tokenVersion`-u DB-dəki ilə tutuşdurur.
  Uyğunsuzluqda → `401 "Session expired, please login again"`.
- `logout`, `changePassword` və `resetPassword` `user.tokenVersion += 1` edir —
  bu, **bütün mövcud access/refresh token-ları anında etibarsız edir**
  ("logout all devices" / şifrə dəyişəndə bütün sessiyaların kəsilməsi).

`authenticate` həmçinin istifadəçinin mövcudluğunu, `isDeleted` və
`status === "active"` olmasını yoxlayır. `requireRole(allowedRoles)` isə
rol-əsaslı icazəni (`403`) təmin edir. `authenticateRefreshToken` və
`authenticateResetToken` müvafiq token növlərini yoxlayır.

---

## 6. Parol hashing (`services/HashService.js`)

- **bcrypt** (`bcryptjs`), `saltRounds = 12`.
- `hashPassword(password)` və `comparePassword(password, hash)`.
- Parollar heç vaxt düz mətn saxlanmır. Qeydiyyatda parol **OTP təsdiqindən əvvəl**
  hash-lanır və OTP payload-ında (`data.hashedPassword`) saxlanır — istifadəçi yalnız
  OTP təsdiqindən sonra yaradılır (`authController.verifyOTP`).
- `EncryptionService.hash` (SHA-256) yalnız müqayisələr üçündür — **parollar üçün
  istifadə olunmur**.

---

## 7. Fayl yükləmə limitləri (`services/FileService.js`)

`express-fileupload` `app.js`-də limitlərlə qoşulur:
```js
fileUpload({
  limits: { fileSize: securityConfig.maxFileSize }, // 10MB
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded (max 10MB)",
})
```

`FileService`-in əlavə qorumaları:
- **MIME whitelist** — yalnız: `image/jpeg`, `image/png`, `image/gif`,
  `image/webp`, `image/svg+xml`, `application/pdf`.
- **Ölçü limiti** — `securityConfig.maxFileSize` (10MB), `validateFile`-də ikinci yoxlama.
- **Path traversal qoruması** — `ensureUploadDir` sub-directory adını
  `[^a-zA-Z0-9_\-/]` regex-i ilə təmizləyir və `path.resolve` nəticəsinin
  `uploads/` kökündən **kənara çıxmadığını** yoxlayır.
- **Anonim fayl adları** — orijinal ad atılır; `crypto.randomBytes(16)` +
  təmizlənmiş uzantı ilə təsadüfi ad yaradılır (yüklənən ada güvənmə yoxdur).

---

## 8. Payload limitləri (`config/config.js` → `securityConfig`)

```js
const securityConfig = {
  sessionTimeout: 15 * 60 * 1000,      // 15 dəq (session ipucu)
  maxPayloadSize: "10mb",              // JSON + urlencoded body limiti
  maxFileSize: 10 * 1024 * 1024,       // 10MB fayl limiti
}
```
`app.js`-də: `express.json({ limit: securityConfig.maxPayloadSize })` və
`express.urlencoded({ ..., limit: securityConfig.maxPayloadSize })` — böyük body
DoS-un qarşısını alır.

---

## 9. Əlavə başlıqlar və cookie siyasəti (`middlewares/security.js`)

**`securityHeaders`** (Helmet-in üstünə "belt-and-braces"):
- `X-Frame-Options: DENY` — clickjacking qoruması.
- `X-XSS-Protection: 1; mode=block`.
- `Referrer-Policy: no-referrer`.
- `X-Powered-By` başlığı silinir (texnologiya barmaq izini gizlədir).

**`noCookies`** — `res.cookie`-ni "wrap" edir: yalnız `options.essential` və ya
`options.httpOnly` olan cookie-lərin yazılmasına icazə verir, qalanlarını sükutla
atır (default olaraq məxfilik). Auth token cookie-ləri `config.cookie`-də
`httpOnly: true` olduğundan keçir.

**Cookie parametrləri (`config.cookie`):**
```js
{
  httpOnly: true,
  secure: isProduction,                       // production-da yalnız HTTPS
  sameSite: isProduction ? "strict" : "lax",  // CSRF azaldılması
  domain: isProduction ? `.${domain}` : undefined,
  path: "/",
}
```
Access cookie 15 dəq, refresh cookie 7 gün (rememberMe 30 gün) yaşayır.

---

## 10. Graceful shutdown (`app.js`)

`SIGTERM`/`SIGINT` alındıqda:
1. `httpServer.close()` — yeni bağlantıları qəbul etməyi dayandırır, mövcudları bitirir.
2. `mongoDBService.disconnect()` — DB bağlantısını təmiz bağlayır.
3. 10 saniyə ərzində bitməsə → `process.exit(1)` (məcburi shutdown).

Bu, deploy/restart zamanı yarımçıq sorğuların və asılı qalan DB bağlantılarının
qarşısını alır (pm2/Docker ilə uyğun).

---

## 11. Production env validasiyası (`app.js` → `validateEnv`)

`initializeServices()` DB-yə qoşulmazdan **əvvəl** `validateEnv()` çağırır. Yalnız
`NODE_ENV === "production"`-da işləyir və aşağıdakıları yoxlayır:

- `ACCESS_SECRET_KEY`, `REFRESH_SECRET_KEY`, `ENCRYPTION_KEY` — **boş və ya default
  dəyərdədirsə** (`starter_access_secret_key` və s.) → konsola CRITICAL xəta yazır
  və `process.exit(1)`.
- `MONGODB_URI` təyin olunmayıbsa → `process.exit(1)`.

Yəni zəif/default sirlərlə production-a çıxmaq **texniki cəhətdən mümkün deyil** —
server açılmır.

---

## 12. Production təhlükəsizlik yoxlama siyahısı

- [ ] **`NODE_ENV=production`** təyin et (cookie `secure`+`strict`, sərt CORS,
      `validateEnv` aktiv).
- [ ] **Sirləri rotasiya et** — `ACCESS_SECRET_KEY`, `REFRESH_SECRET_KEY`,
      `ENCRYPTION_KEY` üçün güclü təsadüfi dəyərlər (`openssl rand -hex 32`).
      Access ≠ Refresh açarı. Default dəyərlərdən **imtina**.
- [ ] **`MONGODB_URI`** production DB-yə (auth-lu, şəbəkə məhdudiyyətli) baxsın.
      DB istifadəçisinə minimum icazə ver.
- [ ] **CORS-u daralt** — `CLIENT_URL` və `DOMAIN` yalnız real frontend origin-lərinə.
      Dev origin-ləri (`5173`/`3000`) production konfiqindən çıxar.
- [ ] **HTTPS** — reverse proxy (nginx) səviyyəsində TLS. `trust proxy` təyin olunub;
      HSTS başlığını proxy-də əlavə et.
- [ ] **Default admin** — `DEFAULT_ADMIN_PASSWORD`-u güclü dəyərlə əvəz et və ilk
      login-dən sonra dəyiş (`BootstrapService`).
- [ ] **SMTP** — real kredensiallar; App Password istifadə et (Gmail üçün).
      Boş SMTP OTP göndərişini no-op edir.
- [ ] **CSP-ni sərtləşdir** — mümkünsə `styleSrc 'unsafe-inline'`-dan imtina,
      `imgSrc`-dən `http://localhost:*`-i sil.
- [ ] **Fayl yükləmə** — `uploads/` qovluğunu web-executable etmə; MIME whitelist-i
      real ehtiyaca görə darald.
- [ ] **Rate limit-ləri** yükünə görə tənzimlə; həssas endpoint-lərə əlavə limiter.
- [ ] **Loglar** — sirləri/PII-ni log-a yazma; `console.error` çıxışını mərkəzi
      log sisteminə yönləndir.
- [ ] **Asılılıqları yenilə** — `pnpm audit`; `helmet`, `express`, `mongoose`,
      `jsonwebtoken` versiyalarını izlə.
