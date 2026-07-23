# components/ui/

## Məqsəd

Bu qovluq tətbiqin dizayn sistemini təşkil edən primitiv, stateless UI komponentlərini saxlayır: `Button`, `Input`, `Card`, `Badge`, `Modal`, `Table`, `Select`, `CustomSelect`, `Checkbox`, `Radio`, `Textarea`, `StatCard`, `PageLoader`. Bu komponentlər biznes məntiqi saxlamır — yalnız görünüş və prop-larla idarə olunan davranış təqdim edir.

## Adlandırma / yazılış konvensiyası

- Fayllar **PascalCase** və `.jsx` uzantısı ilə adlandırılır (`Button.jsx`, `CustomSelect.jsx`).
- Hər komponent **named export**-dur (`export const Button = ...`).
- Stillər Tailwind class-ları ilə verilir; şərti class-lar üçün `clsx` istifadə olunur.
- `index.js` barrel hər faylı `export * from './FaylAdı'` ilə re-export edir.
- Bu primitivlər əsasən prop-driven olduğundan çoxu Server Component kimi işləyir; yalnız daxili state/hook lazım olduqda `'use client'` əlavə olunur.

## Nümunə

`Button.jsx` variant və ölçü prop-ları qəbul edir və `clsx` ilə class birləşdirir:

```js
import { clsx } from 'clsx'

export const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  return (
    <button className={clsx(baseStyles, variants[variant], sizes[size])} {...props}>
      {children}
    </button>
  )
}
```

İstifadə: `import { Button } from '@/components/ui'` (və ya `@/components`).

## Yeni fayl necə əlavə olunur

1. `PascalCase.jsx` faylı yaradın (məs. `Tooltip.jsx`).
2. Komponenti named export kimi yazın və Tailwind class-larını `clsx` ilə birləşdirin.
3. `index.js`-ə `export * from './Tooltip'` sətrini əlavə edin.
4. Artıq `import { Tooltip } from '@/components/ui'` ilə istifadə oluna bilər.
