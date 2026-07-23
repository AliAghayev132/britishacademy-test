# British Academy

Dil mərkəzi üçün tam-stack vebsayt. Hazırda **statik saytdan dinamik sistemə (Next.js + Express)
miqrasiya** mərhələsindədir.

```
britishacademy/
├── apps/
│   ├── api/          ← Express 5 + Mongoose 9 + Socket.IO backend
│   └── web/          ← Next.js 16 (App Router) + RTK Query frontend
├── legacy-static/    ← əvvəlki 60 səhifəlik statik sayt (referans, işlək)
└── docs/
    ├── DATA-MODEL.md            ← domen modelinin dizaynı
    └── template-reference/      ← starter şablonun sənədləri
```

## Miqrasiya mərhələləri

| Mərhələ | Vəziyyət | İş |
|---------|----------|-----|
| 0 | ✅ | Skafold + statikin `legacy-static/`-ə köçürülməsi |
| 1 | ✅ | 17 Mongoose modeli + enum-lar + seed skripti |
| 2 | ⏳ | API — controller + route (public read + admin CRUD) |
| 3 | ⏳ | Next.js public sayt (bütün səhifələr dinamik) |
| 4 | ⏳ | Admin dashboard |
| 5 | ⏳ | SEO paritet (metadata, sitemap, JSON-LD) |

## Backend (`apps/api`)

Express + Mongoose starter şablonu üzərində qurulub. Konvensiyalar:
`docs/template-reference/05-CONVENTIONS.md`. Əsas: `#` alias-ları, hər qovluqda barrel
`index.js`, `asyncHandler`, sabit `{ success, message, data }` cavab formatı, JWT + `tokenVersion`.

```bash
cd apps/api
npm install --legacy-peer-deps
cp .env.example .env.development     # və ya mövcud .env.development-i redaktə et
npm run dev                          # nodemon, http://localhost:5000
node scripts/seed.js                 # statik məzmunu bazaya köçür
node scripts/seed.js --dry           # DB olmadan bütün sənədləri validasiya et
```

**Modellər** (`apps/api/models/`, tam təsvir: `docs/DATA-MODEL.md`):
Branch · Teacher · CourseCategory · Course · CourseGroup (dərs qrafiki) · Testimonial ·
Destination · BlogPost/BlogCategory · MenuItem · Lead · Page · Partner · Advantage · Faq ·
Media · SiteSetting.

Açar məqamlar:
- **Qiymət matrisi** `Course.pricing[]`-də filial-üzrə embed olunur (qrup/fərdi × gündüz/axşam).
- **`CourseGroup`** müəllimi kursa + filiala + qrafikə bağlayır.
- **`SiteSetting`** hero sözləri/rəngləri, statistika, loqolar və PDF-in admin tələblərini
  (head/footer kod inyeksiyası, robots.txt, 500 KB şəkil limiti) saxlayır.
- **`SlugService`** Azərbaycan hərflərini transliterasiya edir (`Uşaqlar üçün` → `usaqlar-ucun`).

## Frontend (`apps/web`)

Next.js 16 App Router + RTK Query + Tailwind v4. Bloq üçün TipTap, karusel üçün embla,
dashboard qrafikləri üçün recharts. (Mərhələ 3-də doldurulur.)

## Legacy statik sayt

`legacy-static/` hələ də tam işlək statik saytdır (generator + 60 səhifə). Dinamik sistem hazır
olana qədər referans və ehtiyat kimi saxlanılır. Onun öz README-si: `legacy-static/README.md`.
