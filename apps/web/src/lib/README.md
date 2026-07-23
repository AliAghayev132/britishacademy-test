# lib/

## Məqsəd

Bu qovluq UI-dan asılı olmayan köməkçi (utility) modulları və konfiqurasiyanı saxlayır. Hazırda burada yalnız `seo.js` var: sayt üzrə SEO defolt dəyərləri (`SITE_NAME`, `SITE_URL`, `DEFAULT_TITLE`, `DEFAULT_DESCRIPTION`, `DEFAULT_IMAGE`) və səhifələr üçün Next.js `Metadata` obyekti quran `buildMetadata()` funksiyası.

## Adlandırma / yazılış konvensiyası

- Fayllar **camelCase** və `.js` uzantısı ilə adlandırılır (`seo.js`).
- Bu qovluqda **barrel `index.js` YOXDUR** — hər modul birbaşa öz yolu ilə import olunur: `@/lib/seo`.
- Sabitlər `UPPER_SNAKE_CASE` named export, funksiyalar isə adi named export kimi ixrac olunur.
- Bu modullar saf JS-dir (React-dən asılı deyil), ona görə həm Server, həm də Client Component-lərdən istifadə oluna bilər; `'use client'` tələb olunmur.

## Nümunə

`seo.js`-dəki `buildMetadata()` səhifə üçün metadata qurur:

```js
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Login',
  path: '/login',
})
```

Kök `layout.js` isə eyni moduldan sabitləri götürür: `import { SITE_NAME, SITE_URL } from '@/lib/seo'`.

## Yeni fayl necə əlavə olunur

1. `camelCase.js` faylı yaradın (məs. `format.js` və ya `validators.js`).
2. Köməkçiləri named export kimi yazın: `export function formatDate(...) { ... }`.
3. Barrel olmadığı üçün birbaşa tam yolla import edin: `import { formatDate } from '@/lib/format'`.
4. Modulu React-dən asılı saxlamayın ki, həm serverdə, həm brauzerdə işləyə bilsin.
