# styles/

## Məqsəd

Bu qovluq tətbiqin global stillərini saxlayır. Hazırda burada `globals.css` var: Tailwind CSS-i import edir, sənəd səviyyəsində baza stillərini (reset, `body` fontu, fon rəngi, `box-sizing`) və `color-scheme`-i təyin edir. Bu fayl bütün tətbiqə tətbiq olunan yeganə global stylesheet-dir.

## Adlandırma / yazılış konvensiyası

- Global stylesheet `globals.css` adlanır (kiçik hərflərlə, `.css` uzantısı).
- Tailwind **v4** tamamilə CSS içində konfiqurasiya olunur: yuxarıda tək `@import "tailwindcss";` sətri var (ayrıca `tailwind.config.js` PostCSS direktivləri əvəzinə). Xüsusiləşdirmələr `@theme` / `@layer` blokları ilə bu faylda edilir.
- Bu fayl JS alias ilə deyil, layout-da nisbi yol (`../styles/globals.css`) ilə import olunur.
- Global CSS yalnız kök `layout.js`-də bir dəfə import edilməlidir.

## Nümunə

`globals.css` Tailwind-i və baza stillərini belə qurur:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  min-height: 100vh;
  background-color: #f9fafb;
  color: #111827;
}
```

Fayl `app/layout.js`-in ən yuxarısında `import '../styles/globals.css'` ilə qoşulur və bütün səhifələrə tətbiq olunur.

## Yeni fayl necə əlavə olunur

1. Qlobal xüsusiləşdirmələr üçün mövcud `globals.css`-ə `@theme` / `@layer` blokları əlavə edin (yeni fayl yaratmaqdansa bunu üstün tutun).
2. Ayrıca stylesheet həqiqətən lazımdırsa, `styles/` altında yeni `.css` faylı yaradın.
3. Onu müvafiq layout və ya komponentdə nisbi yolla import edin (məs. `import '../styles/print.css'`).
4. Bütün tətbiqə aid deyilsə, global `layout.js`-ə deyil, yalnız aid olduğu segmentə import edin.
