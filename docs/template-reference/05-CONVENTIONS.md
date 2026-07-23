# 05 — Konvensiyalar (Coding Conventions)

Bu sənəd şablonda **faktiki işlədilən** kodlaşdırma konvensiyalarını təsvir edir. Yeni kod yazanda
bu nümunələri izləyin ki, üslub vahid qalsın. Bütün nümunələr diskdəki real fayllardandır.

---

## 1. Adlandırma (Naming)

| Element | Konvensiya | Real nümunə |
| --- | --- | --- |
| Server servis faylları | `PascalCase` + `Service` | `AuthTokenService.js`, `MailService.js`, `HashService.js` |
| Server model faylları | `<ad>.model.js` (lowercase) | `user.model.js`, `otp.model.js`, `post.model.js` |
| Server controller faylları | `camelCase` + `Controller` | `authController.js`, `postController.js` |
| Server route faylları | `camelCase` + `Routes` | `authRoutes.js`, `postRoutes.js` |
| Server middleware faylları | `camelCase` (mövzu) | `auth.js`, `security.js`, `sanitize.js` |
| Barrel faylları | həmişə `index.js` | hər qovluqda |
| Mongoose model dəyişəni | `PascalCase` | `export const User = Model("User", userSchema)` |
| React komponent faylları | `PascalCase.jsx` | `Button.jsx`, `LoginPage.jsx`, `ProtectedRoute.jsx` |
| React səhifə qovluqları | `PascalCase/` + `<Ad>.jsx` + `index.js` | `pages/dashboard/PostsPage/PostsPage.jsx` |
| React util/hook faylları | `camelCase` | `formatDate.js`, `useRoomSocket.js`, `imageHandle.js` |
| Custom hook adları | `use` prefiksi | `useRoomSocket`, `useSocket` |
| RTK slice faylları | `camelCase` + `Slice` | `authSlice.js` |
| RTK api faylları | `camelCase` + `Api` | `baseApi.js`, `authApi.js`, `postApi.js` |
| Next route qovluqları | lowercase, route group `(ad)` | `(public)/`, `(protected)/`, `login/`, `dashboard/` |
| Next xüsusi fayllar | Next konvensiyası | `page.js`, `layout.js`, `loading.js`, `error.js`, `not-found.js` |
| Sabitlər (dəyər) | `camelCase` massiv/obyekt | `userRoles`, `statusOptions`, `uploadPaths` |
| React komponent adı = fayl adı | həmişə | `Button.jsx` → `export const Button` |

---

## 2. Barrel export pattern-i

**Hər qovluq bir `index.js` (barrel) ilə öz açıq API-sini təqdim edir.** İdxal edən tərəf konkret
fayl yolunu deyil, qovluğu (alias vasitəsilə) hədəf alır.

Üç növ barrel üslubu işlədilir:

```js
// (a) Adlı re-export — models/index.js
export { User } from "./user.model.js";
export { OTP } from "./otp.model.js";
export { Post } from "./post.model.js";

// (b) Wildcard re-export — middlewares/index.js
export * from "./auth.js";
export * from "./security.js";
export * from "./sanitize.js";

// (c) Namespace re-export — controllers/index.js (VACIB: bax §3.4)
export * as authController from "./authController.js";
export * as postController from "./postController.js";
```

Client tərəfdə də eynidir:

```js
// client-react/src/store/api/index.js
export { baseApi } from './baseApi'
export * from './authApi'
export * from './postApi'
```

**Qayda:** Qovluğa yeni fayl əlavə edəndə həmin qovluğun `index.js`-inə export sətri əlavə et, yoxsa
alias vasitəsilə görünməyəcək.

---

## 3. Server: controller / service / model yazma qaydaları

### 3.1 Controller-lər HƏMİŞƏ `asyncHandler` ilə bükülür

```js
// server/controllers/postController.js
import { asyncHandler } from "#utils";

const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Title and content are required" });
  }
  const post = await Post.create({ title, content, author: req.user._id });
  res.status(201).json({ success: true, message: "Post created", data: { post } });
});
```

- `try/catch` yazma — `asyncHandler` atılan xətanı `next()`-ə ötürür, mərkəzi error handler tutur.
- Validasiya xətalarını `return res.status(4xx).json(...)` ilə erkən qaytar.

### 3.2 Response envelope (cavab forması) sabitdir

Bütün cavablar bu formadadır:

```jsonc
{ "success": true,  "message": "...", "data": { /* ... */ } }   // uğur
{ "success": false, "message": "...", "errors": [ /* ... */ ] } // xəta
```

İki yol var:
- Birbaşa `res.json({ success, message, data })` (controller-lərdə üstünlük verilən üslub), və ya
- `utils/apiResponse.js`-dəki köməkçilər:

```js
// server/utils/apiResponse.js
const ok = (res, data = null, message, status = 200) => { /* { success:true, message?, data? } */ };
const fail = (res, message, status = 400, errors) => { /* { success:false, message, errors? } */ };
```

### 3.3 Service-lər: class + static metod

Servislər state saxlamayan `class`-lardır və `static` metodlarla çağırılır (instansiya yaradılmır),
istisna singleton-lar (`SocketService`, `MongoDBService`) `default` instansiya ixrac edir.

```js
// server/services/HashService.js
class HashService {
  static saltRounds = 12;
  static async hashPassword(password) { return bcrypt.hash(password, this.saltRounds); }
  static async comparePassword(password, hash) { return bcrypt.compare(password, hash); }
}
export { HashService };
```

```js
// Singleton nümunəsi — server/services/SocketService.js
const socketService = new SocketService();
export default socketService;
```

- Xarici paketi birbaşa import etmə — `#lib`-dən götür: `import { bcrypt } from "#lib";`.
- Ağır biznes məntiqi controller-də deyil, service-də yaşayır.

### 3.4 `export * as` namespace pattern-i

Controller-lər `export * as`-la namespace kimi ixrac olunur ki, route-da `authController.login` şəklində
çağırıla bilsin:

```js
// server/routes/authRoutes.js
import { authController } from "#controllers";
AuthRouter.post("/login", loginRateLimiter, authController.login);
AuthRouter.get("/me", authenticate, authController.getMe);
```

### 3.5 Model yazma qaydaları (referans: `post.model.js`)

`post.model.js` bütün Mongoose konvensiyalarını nümayiş etdirir — yeni resurs üçün bunu kopyalayın:

```js
import { Schema, Model, postStatus } from "#constants";      // constants-dan Schema/Model helper-i

const postSchema = new Schema({ /* sahələr */ }, {
  timestamps: true,                    // createdAt / updatedAt
  versionKey: false,                   // __v söndürülür
  toJSON: { virtuals: true },          // virtual-ları JSON-a daxil et
  toObject: { virtuals: true },
});

postSchema.index({ status: 1, createdAt: -1 });               // compound index
postSchema.virtual("url").get(function () { return `/posts/${this.slug}`; });  // virtual
postSchema.pre("save", function (next) { /* slug avtomatik */ next(); });      // pre-hook
postSchema.statics.findPublished = function (f = {}) { /* ... */ };            // static metod
postSchema.methods.incrementViews = async function () { /* ... */ };          // instance metod

export const Post = Model("Post", postSchema);
```

- `Schema`, `Model` birbaşa mongoose-dan deyil, `#constants` (`constants/shared/variables.js`) sarğısından gəlir.
- enum-lar `constants/shared/enums.js`-dən import olunur (`postStatus`, `userRoles`...).
- Soft delete üçün `isDeleted: Boolean` sahəsi; sorğular `isDeleted: false` filtri istifadə edir.

---

## 4. RTK Query + slice pattern-i (client)

### 4.1 `baseApi` + `injectEndpoints`

Tək bir `baseApi` (`createApi`) qurulur, feature endpoint-ləri **ayrı fayllarda** `injectEndpoints`
ilə qoşulur — bu, kod bölünməsi (code-splitting) və modul təşkili üçündür.

```js
// store/api/baseApi.js
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Post', 'Auth'],
  endpoints: () => ({}),
})

// store/api/postApi.js
export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params = {}) => ({ url: '/posts', params }),
      providesTags: (result) => /* per-item + LIST tag */,
    }),
    createPost: builder.mutation({
      query: (data) => ({ url: '/posts', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})
export const { useGetPostsQuery, useCreatePostMutation } = postApi
```

Qaydalar:
- `query: builder.query`, dəyişdirən əməliyyat: `builder.mutation`.
- Oxu endpoint-ləri `providesTags`, yazı endpoint-ləri `invalidatesTags` təyin edir (LIST + per-item pattern).
- Avtogenerasiya olunmuş `useXQuery`/`useXMutation` hook-ları fayl sonunda ixrac olunur.
- Endpoint URL-ləri server route-ları ilə **birə-bir** uyğun gəlir.

### 4.2 Slice pattern-i (`createSlice`)

Server-cache olmayan client state (`auth`) `createSlice` ilə idarə olunur və localStorage-a mirror edilir:

```js
// store/slices/authSlice.js
const authSlice = createSlice({
  name: 'auth',
  initialState,   // localStorage-dan oxunur
  reducers: {
    setCredentials: (state, action) => { /* user+tokens → state + persist() */ },
    setTokens: (state, action) => { /* refresh sonrası tokenləri yenilə */ },
    updateUser: (state, action) => { /* qismən user yeniləməsi */ },
    logout: (state) => { /* hər şeyi təmizlə + localStorage.removeItem */ },
  },
})
export const { setCredentials, setTokens, updateUser, logout } = authSlice.actions
export default authSlice.reducer
```

- `next` variantı əlavə olaraq access tokeni `token` cookie-yə mirror edir (SSR/middleware üçün) və
  bütün `window`/`localStorage` girişini `typeof window !== 'undefined'` ilə mühafizə edir (SSR-safe).
- Store `configureStore`-da `[baseApi.reducerPath]: baseApi.reducer` + `auth: authReducer` və
  `.concat(baseApi.middleware)` ilə qurulur.

---

## 5. React komponent + custom hook pattern-ləri

### 5.1 Komponentlər: adlı arrow export

```js
// Named export + arrow function (client-react üstünlük verir)
export const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const variants = { primary: '...', secondary: '...' };
  return <button className={clsx(baseStyles, variants[variant], className)} {...props}>{children}</button>
}
```

- **client-react**: komponentlər `export const Ad = () => {}` (adlı arrow).
- **client-next**: `page.js`/`layout.js` faylları `export default function Ad() {}` (Next tələbi);
  interaktiv olanlar faylın başında `'use client'` yazır.
- Props üçün default dəyərlər destrukturizasiyada verilir (`variant = 'primary'`).
- className birləşdirmə üçün `clsx` istifadə olunur; stillər variant/size obyektlərində saxlanır.
- Server ilə ünsiyyət səhifə komponentində RTK hook-u + `.unwrap()` + `try/catch` ilə:

```js
// client-react/src/pages/public/LoginPage/LoginPage.jsx
const [login, { isLoading }] = useLoginMutation()
const res = await login(form).unwrap()          // envelope: { data: { user, tokens } }
dispatch(setCredentials(res.data))
```

### 5.2 Form pattern-i

Bir tək `form` state obyekti + ümumi `handleChange`:

```js
const [form, setForm] = useState({ email: '', password: '' })
const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
```

### 5.3 Custom hook pattern-i (`useRoomSocket`)

```js
// client-react/src/store/hooks/useRoomSocket.js
export const useRoomSocket = (roomId, options = {}) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocket()
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return
    joinRoom(roomId)
    socket.on('message:new', handleMessage)
    return () => { leaveRoom(roomId); socket.off('message:new', handleMessage) }
  }, [socket, isConnected, roomId])
  return { isConnected, handleTyping }
}
```

- Hook `use`-la başlayır, `{ ... }` obyekti qaytarır.
- Xarici sistem effektləri (`socket.on`) həmişə cleanup (`return () => socket.off(...)`) ilə müşayiət olunur.
- Context-based state (socket) `useContext` sarğısı ilə (`useSocket`) verilir; provider yoxdursa xəta atılır.

---

## 6. Xəta idarəetməsi konvensiyaları

### 6.1 Server: mərkəzi error middleware

`app.js`-dəki `setupErrorHandlers` bütün xətaları tək yerdə tənzimləyir (bax `01-ARCHITECTURE.md` §2):

```js
app.use((err, req, res, _next) => {
  if (err.name === "ValidationError") return res.status(400).json({ success: false, message: "Validation error", errors: [...] });
  if (err.code === 11000)             return res.status(409).json({ success: false, message: "This record already exists" });
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
                                      return res.status(401).json({ success: false, message: "Session expired" });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, message: statusCode === 500 ? "Server error" : err.message });
});
```

- İstifadə olunmayan `next` parametri `_next` kimi adlandırılır (ESLint `argsIgnorePattern: "^_"`).
- Controller-lər xətanı `throw` edir və ya erkən `return res.status(4xx)...` — mərkəzi handler qalanını tutur.

### 6.2 Client: reauth + istifadəçi bildirişi

- **Şəbəkə/401 səviyyəsi**: `baseQueryWithReauth` 401-i tutur, bir dəfə refresh edir, uğursuz olsa
  `auth/logout` dispatch edir (bax `01-ARCHITECTURE.md` §3.5).
- **UI səviyyəsi**: səhifələr `.unwrap()`-i `try/catch`-ə salır və istifadəçiyə mesaj göstərir:
  ```js
  try {
    await createPost(form).unwrap()
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Save failed', text: err?.data?.message || 'Could not save.' })
  }
  ```
  (`client-react` `sweetalert2`; `client-next/login` sadə `useState` `error` mesajı ilə də göstərir.)
- **Next global boundary**: `src/app/error.js` (`'use client'`) segment səviyyəsində error boundary-dir.

---

## 7. ESLint / Prettier quraşdırması

Hər üç şablon **flat config** (yeni ESLint formatı) istifadə edir.

| | server | client-react | client-next |
| --- | --- | --- | --- |
| Konfiq faylı | `eslint.config.js` | `eslint.config.js` | `eslint.config.mjs` |
| ESLint | ^10.6.0 | ^10.6.0 | ^9 |
| Əsas | Node globals + custom rules | `@eslint/js` + react-hooks + react-refresh | `eslint-config-next/core-web-vitals` |
| Prettier | `.prettierrc` var | — | — |
| Lint script | `eslint .` | `eslint .` | `eslint .` |

### 7.1 Server ESLint qaydaları (əsas)

```js
// server/eslint.config.js (rules parçası)
"no-unused-vars": ["warn", {
  argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_",
}],
"no-console": "off",   // server-də log-a icazə var
"prefer-const": "warn",
"no-var": "error",
```

> Konvensiya: istifadə olunmayan parametr/dəyişən/tutulan xəta **`_` prefiksi** ilə adlandırılır
> (məs. `_next`, `_error`) ki, lint xəbərdarlığı yaranmasın.

### 7.2 client-react ESLint qaydaları

```js
// client-react/eslint.config.js (parça)
extends: [ js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite ],
rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }] },
```

- `SocketContext.jsx` kimi qəsdən qayda pozan fayllar sətir-içi `/* eslint-disable ... */` şərhi ilə
  istisna edilir (məs. `react-refresh/only-export-components`).

### 7.3 Prettier qaydaları (server `.prettierrc`)

```jsonc
{
  "semi": true,             // nöqtəli vergül
  "singleQuote": false,     // qoşa dırnaq (server)
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

> Diqqət: **server** qoşa dırnaq (`"..."`) işlədir, **client-react** kodu isə tək dırnaq (`'...'`)
> üslubundadır. Hər qovluqda mövcud üslubu izləyin.

---

## 8. Sürətli yoxlama siyahısı (yeni resurs əlavə edərkən)

**Server** (məs. yeni `Comment` resursu):
1. `models/comment.model.js` yarat (`post.model.js`-i kopyala), `models/index.js`-ə export əlavə et.
2. Lazım olan enum-ları `constants/shared/enums.js`-ə əlavə et.
3. `controllers/commentController.js` yarat (hər handler `asyncHandler` ilə), `controllers/index.js`-ə `export * as`.
4. `routes/commentRoutes.js` yarat, `routes/index.js`-ə və `app.js`-ə (`app.use('/api/comments', ...)`) qeyd et.
5. Ağır məntiq varsa `services/`-ə əlavə et + `services/index.js`-ə export.

**Client** (hər iki client üçün paralel):
1. `store/api/commentApi.js` yarat (`postApi.js`-i kopyala, `injectEndpoints`), `store/api/index.js`-ə export.
2. `tagTypes`-a lazımdırsa yeni tag əlavə et (`baseApi.js`).
3. Səhifə/komponent yarat, alias ilə import et, RTK hook-u + `.unwrap()` + `try/catch` istifadə et.
4. Statik seçim siyahıları lazımdırsa `constants/`-a əlavə et (server enum-ları ilə sinxron).
