# 03 — Alias sistemi (Import Aliases)

Bu şablonlarda uzun nisbi yolları (`../../../services/...`) aradan qaldırmaq üçün iki fərqli alias
sistemi işlədilir:

- **server/** → Node.js **subpath imports** (`#` prefiksi, `package.json` `"imports"` sahəsi).
- **client-react/** və **client-next/** → bundler/editor alias-ları (`@` prefiksi).

---

## 1. Server: `#` subpath imports

Node.js-in doğma (native) `imports` xüsusiyyəti istifadə olunur — heç bir bundler lazım deyil. Xəritə
`server/package.json`-un `"imports"` sahəsindədir:

```jsonc
// server/package.json
"imports": {
  "#*": "./*",
  "#lib": "./lib/index.js",
  "#utils": "./utils/index.js",
  "#models": "./models/index.js",
  "#routes": "./routes/index.js",
  "#config": "./config/index.js",
  "#services": "./services/index.js",
  "#templates": "./templates/index.js",
  "#constants": "./constants/index.js",
  "#middlewares": "./middlewares/index.js",
  "#controllers": "./controllers/index.js"
}
```

### 1.1 Necə resolve olunur

1. `import { User } from "#models"` yazılır.
2. Node `"imports"` xəritəsində `#models` açarını tapır → `./models/index.js`.
3. `models/index.js` **barrel**-dir və konkret faylları yenidən export edir:

```js
// server/models/index.js
export { User } from "./user.model.js";
export { OTP } from "./otp.model.js";
export { Post } from "./post.model.js";
```

4. Beləliklə `#models` bütün model-lərə tək giriş nöqtəsi olur.

**İki növ açar var:**

| Açar | Növ | Nə edir |
| --- | --- | --- |
| `#lib`, `#models`, `#services` ... | konkret barrel | birbaşa `<qovluq>/index.js`-ə göstərir |
| `#*` → `./*` | catch-all (wildcard) | `#services/EncryptionService.js` kimi **birbaşa fayl** import-una icazə verir |

Catch-all-ın real istifadəsi (`server/models/post.model.js`) — barrel əvəzinə birbaşa fayl import edir:

```js
// server/models/post.model.js
// Birbaşa import (#services barrel-i vasitəsilə DEYİL) — models <-> services
// arasında BootstrapService üzərindən dövri (circular) import-un qarşısını alır.
import { EncryptionService } from "#services/EncryptionService.js";
```

### 1.2 Barrel + lib pattern-i

`server/lib/index.js` bütün xarici (npm + node built-in) modulları tək yerdən re-export edir. Kod heç
vaxt paketi birbaşa import etmir — həmişə `#lib`-dən götürür:

```js
// server/lib/index.js (parça)
export { default as express, Router as ExpressRouter } from "express";
export { default as jwt } from "jsonwebtoken";
export { default as mongoose } from "mongoose";
export { Server as SocketServer } from "socket.io";
// ...
```

```js
// İstifadə (server/services/AuthTokenService.js)
import { jwt } from "#lib";
import { config } from "#config";
```

### 1.3 Before / After

```js
// ❌ ƏVVƏL (nisbi yollar)
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { config } from "../../config/config.js";

// ✅ SONRA (# subpath imports)
import { User } from "#models";
import { asyncHandler } from "#utils";
import { config } from "#config";
```

### 1.4 Yeni alias necə əlavə olunur

1. Yeni qovluq yarat, məs. `server/jobs/`.
2. `server/jobs/index.js` barrel-i yarat:
   ```js
   export { emailQueue } from "./emailQueue.js";
   ```
3. `server/package.json`-un `"imports"` sahəsinə əlavə et:
   ```jsonc
   "#jobs": "./jobs/index.js"
   ```
4. İstifadə et: `import { emailQueue } from "#jobs";`

> Qeyd: `#*` catch-all onsuz da mövcud olduğu üçün konkret açar əlavə etmədən də
> `import { emailQueue } from "#jobs/emailQueue.js"` işləyir. Konkret barrel açarı yalnız qısa,
> təmiz idxal (`#jobs`) üçün lazımdır.

### 1.5 Ümumi tələlər (pitfalls)

| Tələ | İzah / həll |
| --- | --- |
| **Circular barrel** | `models/index.js` → `services/index.js` → (BootstrapService) → `models/index.js` dövrü yaranır. Həll: dövrü qıran modul barrel əvəzinə **birbaşa fayl** import edir (`#services/EncryptionService.js`). |
| **`.js` uzantısı** | ESM-də (`"type": "module"`) daxili relative/subpath import-larda uzantı **məcburidir** (`./user.model.js`). Barrel açarları isə birbaşa `index.js`-ə göstərir. |
| **Yalnız Node daxilində işləyir** | `#` import-ları yalnız `server/` daxilində (Node runtime) resolve olunur; client bundler-ləri bunu bilmir. Client `@` istifadə edir. |
| **Barrel-i yeniləməyi unutmaq** | Yeni fayl əlavə edəndə qovluğun `index.js`-inə export əlavə et, yoxsa `#qovluq`-dan görünməz. |

---

## 2. Client: `@` alias-ı

Hər iki client `@` prefiksindən istifadə edir, lakin **mexanizm fərqlidir**.

### 2.1 client-react — Vite + jsconfig (İKİLİ konfiqurasiya)

React tərəfdə alias **iki yerdə** təyin olunmalıdır və sinxron saxlanmalıdır:

**(a) `vite.config.js` → `resolve.alias`** (build zamanı faktiki resolve):

```js
// client-react/vite.config.js (parça)
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@components': path.resolve(__dirname, './src/components'),
    '@pages': path.resolve(__dirname, './src/pages'),
    '@routes': path.resolve(__dirname, './src/routes'),
    '@hooks': path.resolve(__dirname, './src/hooks'),
    '@store': path.resolve(__dirname, './src/store'),
    '@services': path.resolve(__dirname, './src/services'),
    '@assets': path.resolve(__dirname, './src/assets'),
    '@layouts': path.resolve(__dirname, './src/layouts'),
    '@constants': path.resolve(__dirname, './src/constants'),
    '@utils': path.resolve(__dirname, './src/utils'),
  },
},
```

**(b) `jsconfig.json` → `paths`** (yalnız editor/IDE-nin auto-import və "go to definition" üçün):

```jsonc
// client-react/jsconfig.json
"paths": {
  "@/*": ["src/*"],
  "@components/*": ["src/components/*"],
  "@pages/*": ["src/pages/*"],
  "@routes/*": ["src/routes/*"],
  "@hooks/*": ["src/hooks/*"],
  "@store/*": ["src/store/*"],
  "@services/*": ["src/services/*"],
  "@assets/*": ["src/assets/*"],
  "@layouts/*": ["src/layouts/*"],
  "@constants/*": ["src/constants/*"],
  "@utils/*": ["src/utils/*"],
  "@utils": ["src/utils/index.js"]
}
```

> **Vacib:** `vite.config.js` faktiki build-i idarə edir; `jsconfig.json` yalnız editor rahatlığı üçündür.
> Biri yenilənəndə **digəri də yenilənməlidir**, əks halda editor xəta göstərmədən build sınar (və ya
> əksinə).

Real istifadə (`client-react/src/pages/dashboard/PostsPage/PostsPage.jsx`):

```js
import { SEO, Card, Table, Button } from '@components'
import { useGetPostsQuery, useCreatePostMutation } from '@store/api'
import { statusOptions, statusBadgeVariant } from '@constants'
import { formatDate } from '@utils'
```

### 2.2 client-next — yalnız jsconfig

Next.js `@/*` alias-ını **doğma** olaraq `jsconfig.json`-dan oxuyur (əlavə bundler konfiqi lazım deyil).
Yalnız bir alias var:

```jsonc
// client-next/jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Real istifadə (`client-next/src/app/(public)/login/page.js`):

```js
import { Button, Input, Card, Checkbox } from '@/components/ui'
import { useLoginMutation } from '@/store/api'
import { setCredentials } from '@/store/slices/authSlice'
```

### 2.3 Before / After (client)

```js
// ❌ ƏVVƏL
import { Button } from '../../../components/ui'
import { store } from '../../store'

// ✅ SONRA — client-react (çoxsaylı prefiks)
import { Button } from '@components'
import { store } from '@store'

// ✅ SONRA — client-next (tək `@/` prefiksi, tam yol)
import { Button } from '@/components/ui'
import { store } from '@/store'
```

### 2.4 Fərqlərin xülasəsi

| | client-react | client-next |
| --- | --- | --- |
| Prefiks stili | çoxsaylı (`@components`, `@store`, `@utils`...) | tək (`@/...` tam yolla) |
| Faktiki resolver | `vite.config.js` `resolve.alias` | Next.js (jsconfig-i doğma oxuyur) |
| Editor dəstəyi | `jsconfig.json` `paths` | eyni `jsconfig.json` |
| Sinxron saxlama | **2 fayl** (vite + jsconfig) | **1 fayl** (jsconfig) |
| Yeni alias əlavə etmək | hər iki fayla yaz | (adətən lazım deyil — `@/` bütün `src`-i əhatə edir) |

### 2.5 Client tələləri

| Tələ | Həll |
| --- | --- |
| React-də alias yalnız bir faylda təyin edilir | `@x` build-də işləyir amma editor xəta verir (və ya əksinə). Hər iki faylı yenilə. |
| `@services`/`@hooks`/`@assets` qovluğu hələ mövcud deyil | Alias `vite.config.js`-də təyin olunub, amma qovluq boşdur — import etməzdən əvvəl qovluğu yarat. |
| Next-də çoxsaylı prefiks gözləmək | Next yalnız `@/*` təyin edib; `@components` işləməyəcək — `@/components` yaz. |

---

## 3. Yekun müqayisə cədvəli

| Xüsusiyyət | server (`#`) | client-react (`@`) | client-next (`@`) |
| --- | --- | --- | --- |
| Mənbə fayl | `package.json` `"imports"` | `vite.config.js` + `jsconfig.json` | `jsconfig.json` |
| Resolver | Node.js runtime | Vite (Rolldown) | Next.js |
| Barrel-lərlə işləyir | bəli (`#models` → index.js) | bəli (`@store/api` → index.js) | bəli (`@/store/api` → index.js) |
| Wildcard | `#*` → `./*` | `@/*` → `src/*` | `@/*` → `./src/*` |
| Uzantı tələb olunur | daxili relative-lərdə bəli | xeyr | xeyr |
