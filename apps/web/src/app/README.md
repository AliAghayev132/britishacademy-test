# app/

## Məqsəd

Bu qovluq Next.js **App Router**-ın kök (root) qovluğudur. Bütün route-lar, layout-lar və App Router-a məxsus xüsusi (special) fayllar burada yerləşir. Bu qovluqdakı fayllar birbaşa route ağacını və HTML metadata-nı təyin edir; heç bir yerdən manual import edilmir — Next.js onları ad konvensiyasına görə avtomatik yükləyir.

## Adlandırma / yazılış konvensiyası

App Router **rezerv edilmiş fayl adlarından** istifadə edir və bu adlar dəyişdirilə bilməz:

- `layout.js` — kök layout (məcburidir; `<html>` və `<body>` qaytarmalıdır).
- `loading.js`, `error.js`, `not-found.js` — naviqasiya/xəta/404 vəziyyətləri üçün rezerv adlar.
- `robots.js`, `sitemap.js` — metadata route handler-ləri (`/robots.txt` və `/sitemap.xml` generasiya edir).
- `providers.jsx` — Redux/Socket provider-lərini bir Client Component-ə sarıyan köməkçi.

`error.js` və `providers.jsx` brauzer API-lərindən istifadə etdiyi üçün fayl başında `'use client'` direktivi olmalıdır. Import-lar yeganə `@/` alias-ı ilə yazılır (`@/lib/seo`, `@/components/ui`).

## Nümunə

`layout.js` — kök layout, global CSS və provider-ləri qoşur:

```js
import '../styles/globals.css'
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Bu faylı Next.js avtomatik olaraq bütün route-ların kök layout-u kimi yükləyir.

## Yeni fayl necə əlavə olunur

1. Yeni route üçün alt-qovluq yaradın (məs. `app/about/`) və içinə `page.jsx` qoyun.
2. Həmin segment üçün xüsusi UI lazımdırsa, rezerv adlardan istifadə edin: `loading.js`, `error.js` (Client Component), `not-found.js`.
3. Metadata üçün `page.jsx`-də `export const metadata` və ya `generateMetadata()` yazın — dəyərləri `@/lib/seo`-dakı `buildMetadata()` ilə qurun.
