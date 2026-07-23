# British Academy — vebsayt

Dil mərkəzi üçün çoxsəhifəli statik vebsayt. **Təmiz HTML / CSS / JS** — deploy üçün heç bir build alət, framework və ya asılılıq yoxdur. Birbaşa açmaq və ya istənilən statik hostinqə (GitHub Pages və s.) yükləmək üçün hazırdır.

58 səhifə eyni mega-menyunu, `css/style.css` və `js/main.js` faylını paylaşır.

## Menyu strukturu (PDF texniki tapşırığına uyğun)

- **Haqqımızda**
- **Uşaq Proqramları** → İngilis dili · Rus dili · Məntiq
- **Xidmətlər** (mega-menyu)
  - Dil Kursları → İngilis (General/Business/Legal/Hospitality), Alman, Rus, İspan, İtalyan, Fransız
  - Danışıq Klubları → Conversation Club · Workshop
  - Beynəlxalq imtahanlar → IELTS · TOEFL · OET · TOEIC · SAT · Duolingo · TOLES
  - Peşəkar Sertifikat → TEFL
  - Kompüter Kursu → MS Office · Peşəkar Excel
  - Karyera kursları → Mühasibatlıq və 1C · HR & Kargüzarlıq
- **Tələbələrə özəl** → Dinləmə günü · Film günü
- **Xaricdə təhsil** → 11 ölkə
- **Taqaüd Proqramları**
- **Əlaqə**

*Müəllimlər* və *Bloq* səhifələri footer-dən əlçatandır.

## Struktur

```
britishacademy/
├── index.html                 ← ana səhifə
├── haqqimizda.html, muellimler.html, muellim.html, bloq.html, blogyazi.html
├── usaq-*.html, *-kursu.html, ielts.html … (kurs/hub səhifələri)
├── xaricde-*.html             ← xaricdə təhsil ölkələri
├── elaqe.html, taqaud-proqramlari.html
├── sitemap.xml, robots.txt    ← generasiya olunur
├── css/style.css              ← bütün stillər (mega-menyu daxil)
├── js/main.js                 ← bütün interaktivlik (dropdown, mobil menyu, axtarış…)
├── tools/build.mjs            ← DEV generator (deploy üçün lazım deyil)
└── docs/                      ← dizayn spesifikasiyası + admin panel tələbləri
```

## Generator (səhifə/menyu yeniləmək üçün)

Bütün səhifələr, menyu, `sitemap.xml` və `robots.txt` **tək mənbədən** — `tools/build.mjs` — yaradılır.

```bash
node tools/build.mjs
```

- **Yeni kurs əlavə etmək:** `tools/build.mjs` içindəki `MENU` ağacına `{ label, slug }` əlavə et → generatoru işə sal. Menyu, yeni səhifə, sitemap avtomatik yenilənir.
- **Domain dəyişmək:** faylın başındakı `const ORIGIN = 'https://britishacademy.az'` dəyərini dəyiş → generatoru işə sal. Bütün canonical / Open Graph / sitemap URL-ləri avtomatik yenilənir.
- Generator mövcud 6 səhifəni də avtomatik patch edir (nav + SEO). Təkrar işə salmaq təhlükəsizdir (idempotent).

## Kurs mətnləri (SEO məzmunu)

Kurs səhifələrinin mətnləri **`tools/content.mjs`** faylındadır — slug üzrə obyekt:

```js
'ingilis-dili-kursu.html': {
  h1, lead, info: [[ad, dəyər]], intro: [abzas],
  sections: [{ h:2|3, t, p:[], ul:[], dl:[[ad,izah]], highlight, note }],
  faq: [[sual, cavab]],
  pricing: { only:[filial indeksi] | custom:[[ad,qiymət]], note }
}
```

Mətni dəyiş → `node tools/build.mjs`. FAQ avtomatik akkordeon + **FAQPage schema** olur.
`pricing.only` kursu tək filiala bağlayır (Alman dili), `pricing.custom` isə filial cədvəlini
əvəz edir (Danışıq klubları).

## Loqo və maskotlar

`assets/` qovluğunda hazır, optimallaşdırılmış fayllar (hamısı < 500 KB):

| Fayl | İstifadə |
|------|----------|
| `logo.png` | Header (bütün səhifələr) |
| `logo-stack.png` | Footer və yüklənmə ekranı (ağ fon üzərində) |
| `shield.png` | Müraciət pəncərəsi |
| `badge11.png` | Footer-dəki dairəvi «11 il sizinlə» nişanı |
| `favicon.png`, `favicon-180.png` | Brauzer ikonu / iOS |
| `og-cover.png` | Sosial şəbəkə paylaşım şəkli (1200×630) |

Mənbə fayllar (`hugelogo.png`, `midlogo.png`, `small.png`, `11.png`) 4K ölçüdədir və
birbaşa saytda **istifadə olunmur** — `assets/` içindəkilər onlardan kəsilib kiçildilib.

**Maskotlar:** `assets/mascot/` qovluğuna 5 PNG at — `flag`, `gift`, `wave`, `point`, `run`.
Təfərrüat: [assets/mascot/README.md](assets/mascot/README.md). Fayl yoxdursa sayt pozulmur,
şəkil sadəcə görünmür.

## SEO (statik olaraq quruldu)

Hər səhifədə: unikal `<title>` + `meta description`, `canonical`, **Open Graph** + Twitter Card, **JSON-LD schema** (`EducationalOrganization` + `BreadcrumbList` + `Course`). Əlavə: `sitemap.xml`, `robots.txt`.

Admin-panel tələb edən bəndlər (head kod inputu, 500KB şəkil limiti, bloq redaktoru, avto img-alt və s.) `docs/ADMIN-PANEL-TELEBLERI.md` faylında qeyd olunub.

## Şəkillər

Şəkil yerləri hazırda placeholder qutularıdır (`.img-slot`). Real şəkil əlavə edəndə:

```html
<img src="assets/ad.jpg" alt="Təsvir" loading="lazy" width="800" height="600">
```

`loading="lazy"` (lazy load) və `alt` mütləqdir; şəkli ≤ 500KB sıxışdır. `og:image` üçün köke `og-cover.jpg` (~1200×630) əlavə et.

## Rəng

Əsas rəng `css/style.css`-də `--accent` dəyişəni ilə idarə olunur (standart `#4F5BF0`).

## Lokal işə salmaq

```bash
npx serve .
```

və ya `index.html`-i birbaşa brauzerdə aç.
