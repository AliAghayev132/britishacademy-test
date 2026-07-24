# British Academy

Dil mərkəzi üçün tam-stack vebsayt: **Next.js 16 + Express 5 + MongoDB**.
Statik saytdan dinamik sistemə miqrasiya tamamlanıb — bütün məzmun bazadan gəlir
və admin paneldən idarə olunur.

```
britishacademy/
├── index.html, *.html, css/, js/, assets/, tools/   ← statik sayt (GitHub Pages kökdən verir)
├── apps/
│   ├── api/          ← Express 5 + Mongoose 9 + Socket.IO backend
│   └── web/          ← Next.js 16 (App Router) + RTK Query frontend
└── docs/
    ├── API.md                   ← marşrut arayışı (PUBLIC vs ADMIN)
    ├── DATA-MODEL.md            ← domen modelinin dizaynı
    └── template-reference/      ← starter şablonun sənədləri
```

> **Kökdəki statik sayt** GitHub Pages üçündür (60 səhifə, `tools/build.mjs` ilə generasiya olunur).
> Dinamik sistem `apps/` altındadır və ayrıca deploy olunur — bir-birinə qarışmır.

## Sürətli başlanğıc

MongoDB lokal işləməlidir (`mongodb://localhost:27017/britishacademy`).

```bash
# 1) Backend
cd apps/api
npm install --legacy-peer-deps
node scripts/seed.js          # statik məzmunu bazaya köçürür
npm run dev                   # http://localhost:5000

# 2) Frontend (ayrı terminalda)
cd apps/web
npm install --legacy-peer-deps
npm run dev                   # http://localhost:3000
```

Admin panel: `http://localhost:3000/dashboard`
(ilk boot-da yaranan admin: `.env.development`-dəki `DEFAULT_ADMIN_*`).

> `INTERNAL_API_KEY` hər iki `.env`-də **eyni** olmalıdır — Next SSR bütün trafiki
> tək IP-dən göndərdiyi üçün bu açar API-nin per-IP rate limitini keçir.

## Miqrasiya mərhələləri

| Mərhələ | Vəziyyət | İş |
|---------|----------|-----|
| 0 | ✅ | Skafold + statikin `legacy-static/`-ə köçürülməsi |
| 1 | ✅ | 17 Mongoose modeli + enum-lar + seed skripti |
| 2 | ✅ | API — 22 public endpoint + 16 resurs üzrə admin CRUD |
| 3 | ✅ | Next.js public sayt — bütün səhifələr dinamik |
| 4 | ✅ | Admin dashboard (resurslar, müraciətlər, tənzimləmələr) |
| 5 | ✅ | SEO — metadata, canonical, JSON-LD, dinamik sitemap/robots |

## Səhifələr

| Marşrut | Məzmun |
|---------|--------|
| `/` | Hero (dinamik sözlər/rənglər), kurslar, üstünlüklər, xaricdə təhsil, rəylər, tərəfdaşlar |
| `/kurslar` · `/kurslar/[slug]` | Kurs hub-ı; slug həm **kursu**, həm **kateqoriya hub-ını** tanıyır |
| `/filiallar` | Filiallar (ünvan, saat, WhatsApp, zəng) |
| `/muellimler` · `/muellimler/[slug]` | Müəllim heyəti + profil (dərs qrafiki ilə) |
| `/telebelerimiz` | Video rəylər + rəy divarı |
| `/xaricde-tehsil` · `/[slug]` | Ölkələr + təqaüd proqramları |
| `/bloq` · `/bloq/[slug]` | Bloq (kateqoriya filtri, TipTap HTML, DOMPurify) |
| `/elaqe` · `/haqqimizda` | Əlaqə (lead forması) · Haqqımızda |
| `/dashboard/*` | Admin panel (Edge middleware ilə qorunur) |

Kurs səhifəsi: content blokları, «Qısa məlumat» kartı, **filiallar üzrə qiymət matrisi**
(qrup/fərdi × gündüz/axşam) + həmin filialın müəllimləri, FAQ akkordeon,
Course + FAQPage + BreadcrumbList JSON-LD.

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

Next.js 16 App Router + RTK Query + Tailwind v4.

- **Data**: Server Component-lər `src/lib/api.js` (`apiGet` / `apiGetStatus`, ISR 60 san) ilə
  API-dən çəkir; klient interaktivliyi RTK Query (`store/api/{publicApi,leadApi,adminApi}.js`).
- **Chrome**: `components/site/*` — `SiteProvider` (müraciət modalı konteksti), `Header`
  (dinamik mega-menyu, mobil çekmecə), `Footer`, `ApplyModal`, `WhatsAppWidget` (filial seçici).
- **Stillər**: `globals.css` = Tailwind v4 + `legacy-static`-dən köçürülmüş təsdiqlənmiş
  dizayn sistemi (mega-menyu, kartlar, qiymət cədvəli, rəy divarı). Fontlar: Poppins + Nunito Sans.
- **Route qrupları**: `(public)` marketinq qabığı ilə, `(auth)` login/register (qabıqsız),
  `(protected)/dashboard` admin. Qorunma: `src/proxy.js` (Edge, `token` cookie).

> `loading.js` **qəsdən** yalnız `(auth)` və `(protected)` qruplarındadır. Kökdə olsaydı,
> bütün public marşrutları Suspense sərhədinə salıb `notFound()`-un 404 statusu qaytarmasına
> mane olardı (soft 404).

### Admin panel

`/dashboard` — sayğaclar + son müraciətlər · `/dashboard/muracietler` — lead pipeline ·
`/dashboard/resurslar/[resource]` — 16 resurs üçün generic CRUD (cədvəl, axtarış, JSON redaktoru) ·
`/dashboard/tenzimlemeler` — əlaqə, sosial, hero, statistika, head/body kod inyeksiyası,
robots.txt, şəkil limiti.

## Statik sayt (GitHub Pages)

Repo kökündəki HTML/CSS/JS **tam işlək statik saytdır** — GitHub Pages onu birbaşa kökdən verir
(`Settings → Pages → Branch: main / root`). 60 səhifə `tools/build.mjs` generatoru ilə yaradılır:

```bash
node tools/build.mjs      # menyu/SEO/sitemap-i yenidən qurur
```

Dinamik sistem (`apps/`) bundan **asılı deyil** — yeganə əlaqə odur ki, `apps/api/scripts/seed.js`
kurs mətnlərini `tools/content.mjs`-dən oxuyur.

## API marşrutları

Tam arayış: **[docs/API.md](docs/API.md)**. Qısaca:

| | Prefiks | Auth |
|---|---------|------|
| Public | `/api/*` | yoxdur (yeganə yazma: `POST /api/leads`) |
| Admin | `/api/admin/*` | JWT + `admin`/`editor` rolu |

Admin router `app.js`-də public-dən **əvvəl** mount olunur və guard router səviyyəsindədir —
`adminRoutes.js`-ə əlavə olunan hər yeni endpoint avtomatik qorunur.
Next.js tərəfində: public → `publicApi.js`/`lib/api.js`, admin → `adminApi.js`
(**yalnız** `(protected)/dashboard/**` daxilində).
