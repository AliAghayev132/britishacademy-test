# components/

## Məqsəd

Bu qovluq bütün paylaşılan (reusable) React komponentlərini saxlayır: layout komponentləri (məs. `DashboardSidebar`), SEO köməkçiləri (`JsonLd`) və `ui/` alt-qovluğundakı primitiv UI elementləri. Komponentlər buradan yeganə barrel — `index.js` vasitəsilə re-export olunur ki, tətbiqin qalan hissəsi onları tək bir nöqtədən import edə bilsin.

## Adlandırma / yazılış konvensiyası

- Komponent faylları **PascalCase** və `.jsx` uzantısı ilə adlandırılır (`DashboardSidebar.jsx`, `JsonLd.jsx`).
- Hər komponent **named export** kimi ixrac olunur (`export const DashboardSidebar = ...`).
- `index.js` barrel bütün ixracları toplayır: `ui/` alt-qovluğunu `export * from './ui'` ilə, tək komponentləri isə adla re-export edir.
- Brauzer hook-larından (`useState`, `useSelector`, `usePathname`) istifadə edən komponentlərdə fayl başında `'use client'` olmalıdır (`DashboardSidebar.jsx`). `JsonLd.jsx` isə Server Component-dir — `'use client'` yoxdur.
- Import-lar `@/components` və ya `@/components/ui` alias-ı ilə yazılır.

## Nümunə

`index.js` barrel-i komponentləri belə toplayır:

```js
export * from './ui'
export { JsonLd } from './JsonLd'
export { DashboardSidebar } from './DashboardSidebar'
```

İstifadə: `import { DashboardSidebar, JsonLd } from '@/components'`.

## Yeni fayl necə əlavə olunur

1. Qovluqda `PascalCase.jsx` faylı yaradın (məs. `Navbar.jsx`).
2. Komponenti named export kimi yazın: `export const Navbar = ({ ... }) => { ... }`. Brauzer hook-ları istifadə edirsinizsə, birinci sətrə `'use client'` əlavə edin.
3. `index.js`-ə bir sətir əlavə edin: `export { Navbar } from './Navbar'`.
4. Artıq `import { Navbar } from '@/components'` ilə istifadə oluna bilər.
