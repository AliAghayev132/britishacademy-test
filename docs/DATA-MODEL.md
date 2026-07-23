# British Academy — Data model (Next.js + Express migrasiyası)

Statik saytda **görünən hər şey** bu modellərdən gəlir. Prinsip: admin paneldən
dəyişməli olan heç nə koda sabit yazılmır.

Stack: Express 5 + Mongoose 9 (`apps/api`) · Next.js 16 + RTK Query (`apps/web`).
Konvensiyalar: `docs/template-reference/05-CONVENTIONS.md`.

---

## 1. Modellərin xəritəsi

| # | Model | Saytda nəyi idarə edir |
|---|-------|------------------------|
| 1 | `User` | Admin panelə giriş (şablondan gəlir) |
| 2 | `Branch` | Filiallar səhifəsi, qiymət kartları, WhatsApp menyusu, əlaqə |
| 3 | `Teacher` | Müəllimlər səhifəsi, müəllim profili, kurs səhifələrindəki müəllimlər |
| 4 | `CourseCategory` | Menyu qrupları (Dil Kursları, İmtahanlar, Kompüter…) |
| 5 | `Course` | Kurs səhifələri: mətn, FAQ, üstünlüklər, qiymətlər |
| 6 | `CourseGroup` | **Dərs qrafiki** — hansı müəllim, hansı filialda, hansı saatda |
| 7 | `Testimonial` | Tələbələrimiz: video rəylər + şərhlər |
| 8 | `BlogPost` + `BlogCategory` | Bloq |
| 9 | `Destination` | Xaricdə təhsil ölkələri + təqaüd proqramları |
| 10 | `Page` | Haqqımızda və digər statik səhifələr |
| 11 | `Partner` | Tərəfdaş loqoları |
| 12 | `Advantage` | «Üstünlüklərimiz» blokları |
| 13 | `Faq` | Sayt üzrə ümumi FAQ |
| 14 | `Lead` | «Müraciət et» formasından gələn müraciətlər |
| 15 | `MenuItem` | Naviqasiya (admin paneldən dəyişilir) |
| 16 | `SiteSetting` | Loqo, əlaqə, statistika, hero sözləri, head/footer kod, robots.txt |
| 17 | `Media` | Yüklənən fayllar (500 KB limiti, fayl adından `alt`) |

---

## 2. Əsas modellər

### Branch — Filial
```js
{
  name, slug,                    // "Əhmədli filialı" / "ehmedli"
  address, district, metro,
  phone, whatsapp, email,
  workingHours: [{ days, from, to }],
  coords: { lat, lng },          // xəritə
  images: [String],
  isMain: Boolean,               // Caspian Plaza
  order, isActive
}
```
İstifadə: Filiallar səhifəsi · kurs qiymət kartları · WhatsApp filial menyusu · footer.

### Teacher — Müəllim
```js
{
  fullName, slug, photo,
  title,                         // "IELTS 8.5 · İngilis dili"
  bio,                           // zəngin mətn (TipTap)
  branches: [ref Branch],        // hansı filiallarda dərs deyir
  courses:  [ref Course],        // hansı kursları aparır
  certificates: [{ title, image, year }],
  stats: { experienceYears, studentsCount, examScore },
  introVideo: { url, poster, duration },   // sınaq dərsi videosu
  socials: { instagram, linkedin },
  order, isActive
}
```
İstifadə: Müəllimlər siyahısı · müəllim profili · **kurs səhifəsində filial üzrə müəllim çipləri**.

### CourseCategory — Kateqoriya
```js
{ name, slug, parent: ref CourseCategory, icon, description, order, isActive }
```
Öz-özünə istinad edir → Xidmətlər ▸ Dil Kursları ▸ İngilis dili kimi iyerarxiya qurulur.

### Course — Kurs
```js
{
  title, slug, category: ref CourseCategory,
  h1, lead, excerpt,             // hero başlığı + qısa mətn
  content: [                     // SEO mətni — sıralı bloklar
    { type: 'paragraph'|'list'|'definitions'|'highlight'|'note',
      heading, headingLevel: 2|3, body, items: [] }
  ],
  faq: [{ question, answer }],   // FAQPage schema buradan qurulur
  info: [{ label, value }],      // "Qısa məlumat" kartı
  features: [{ icon, title, text }],
  levels: ['A1','A2','B1','B2','C1','C2'],
  lesson: { perWeek: 2, minutes: 90, levelDurationMonths: [1.5, 2] },
  groupSize: { min: 3, max: 6 },
  pricing: [{                    // ← filial üzrə matris
    branch: ref Branch,
    group:      { day: Number, evening: Number },
    individual: { day: Number, evening: Number },
    currency: 'AZN', period: 'month', note
  }],
  pricingMode: 'branch' | 'custom',   // custom → danışıq klubları kimi seans qiyməti
  customPricing: [{ label, value }],
  image, gallery: [String],
  seo: { metaTitle, metaDescription, ogImage, noindex },
  isFeatured,                    // ana səhifədə görünsün
  order, isActive
}
```
**Qeyd:** qiymət `pricing` massivində filial-üzrə **embed** olunur, çünki UI-da məhz bu formada
göstərilir və admin bir ekranda redaktə edir. Ayrıca `CoursePrice` kolleksiyası yaratmırıq —
sorğu ehtiyacı yoxdur, mürəkkəbliyi artırardı.

### CourseGroup — Dərs qrafiki
```js
{
  course: ref Course, branch: ref Branch, teacher: ref Teacher,
  level, format: 'group'|'individual',
  schedule: [{ weekday: 1..7, from: '19:00', to: '20:30' }],
  startDate, endDate,
  capacity, enrolled,
  status: 'open'|'full'|'ongoing'|'finished',
  priceOverride: Number,
  isActive
}
```
Bu model **müəllimi filiala və kursa bağlayan** həlqədir: «hansı müəllim, hansı filialda,
hansı kursu, hansı saatda aparır» sualının cavabı. Ondan həm cədvəl səhifəsi,
həm də kurs səhifəsindəki «bu filialda dərs deyir» bloku doldurulur.

### Testimonial — Məzun rəyi
```js
{
  name, photo, type: 'video'|'text',
  course: ref Course, branch: ref Branch,
  achievement,                   // "IELTS 7.5"
  quote, rating: 1..5,           // mətn rəyi
  video: { url, poster, duration },
  isFeatured,                    // ana səhifə
  order, isActive
}
```

### BlogPost — Bloq
```js
{
  title, slug, excerpt,
  content,                       // TipTap HTML (H1/H2 seçimi + link — TT şərti)
  cover, category: ref BlogCategory, tags: [String],
  author: ref User, readMinutes, views,
  status: 'draft'|'published', publishedAt,
  seo: { metaTitle, metaDescription, ogImage }
}
```

### Destination — Xaricdə təhsil
```js
{
  country, slug, flag, region,   // "Almaniya" / bayraq SVG / "Avropa"
  lead, content: [blok],         // Course.content ilə eyni struktur
  universities: [{ name, city, url }],
  facts: [{ label, value }],     // təhsil dili, viza, təhsil haqqı
  isScholarship: Boolean,        // Taqaüd proqramları da bu modeldədir
  order, isActive, seo
}
```

### SiteSetting — Sayt tənzimləmələri (tək sənəd)
```js
{
  brand: { name, logo, logoStack, shield, favicon, ogImage },
  contact: { phone, phone2, email, address, hours },
  socials: { instagram, facebook, youtube, whatsapp },
  hero: { words: [String], colors: [String] },     // fırlanan sözlər + brend rəngləri
  stats: [{ value, label }],                       // 20 000+ məzun …
  marquee: [String],
  seo: { titleTemplate, defaultDescription, defaultOgImage },
  codeInjection: { head, bodyEnd },                // ← PDF tələbi
  robotsTxt: String                                // ← PDF tələbi
}
```

### Lead — Müraciət
```js
{
  name, phone, email,
  course: ref Course, branch: ref Branch,
  message, source,               // hansı səhifədən gəlib
  status: 'new'|'contacted'|'enrolled'|'rejected',
  note, handledBy: ref User
}
```
Hazırda forma sadəcə `alert()` göstərir — bu model ilə müraciətlər bazaya düşəcək.

### MenuItem — Naviqasiya
```js
{ label, href, type: 'link'|'dropdown'|'mega',
  parent: ref MenuItem, order, isVisible, column }
```
Menyunu bu sessiyada dəfələrlə dəyişdik — dinamik olsun ki, koda toxunmadan idarə edilsin.

---

## 3. Əlaqə diaqramı

```
CourseCategory ──< Course ──< CourseGroup >── Teacher >──< Branch
                     │            │                          │
                     │            └── schedule, capacity      │
                     ├── pricing[] ────────────────────────────┘
                     └──< Testimonial

SiteSetting (tək)   MenuItem (ağac)   BlogPost >── BlogCategory
Destination         Page   Partner   Advantage   Faq   Lead   Media
```

---

## 4. Mərhələlər

| Mərhələ | İş |
|---------|-----|
| **0** ✅ | Skafold: `apps/api`, `apps/web`, statik sayt → `legacy-static/` |
| **1** | Modellər + enum-lar + seed skripti (mövcud statik məzmun bazaya köçürülür) |
| **2** | API: controller + route (hər resurs üçün CRUD + public read endpoint-ləri) |
| **3** | Next.js public sayt — bütün səhifələr dinamik |
| **4** | Admin dashboard — hər model üçün idarəetmə ekranı |
| **5** | SEO paritet: metadata, sitemap, robots, JSON-LD, şəkil limitləri |
