# Admin panel tələbləri — PDF texniki tapşırığı üzrə status

Bu sənəd PDF-dəki (`British Academy - Sayfa1.pdf`) bütün bəndləri sadalayır və hər birinin
mövcud **statik saytda** vəziyyətini göstərir.

Sayt hazırda **təmiz statik HTML/CSS/JS**-dir (backend / verilənlər bazası / admin panel yoxdur).
Ona görə bəndlər iki qrupa bölünür:

- ✅ **Statik olaraq edilib** — kodda birbaşa quruldu, işləyir.
- 🔧 **Admin panel / CMS tələb edir** — istifadəçinin brauzerdən redaktə etməsi üçün backend lazımdır.
  Statik faylda "redaktə sahəsi" yaratmaq mümkün deyil; nəticə isə (məs. canonical, robots, schema)
  onsuz da kodda var.

---

## 1. "Saytda başdan olmalı" (SEO əsasları)

| PDF bəndi | Status | İzah |
|-----------|--------|------|
| **Canonical tag** — hər səhifədə | ✅ | Hər səhifənin `<head>` hissəsinə `<link rel="canonical">` əlavə olundu. `view-source` → `Ctrl+F` → `canonical` ilə yoxlaya bilərsən. www / trailing-slash variantları eyni kanonik URL-ə işarə edir. |
| **Sitemap** | ✅ | `sitemap.xml` yaradıldı (58 URL). Domain qoşulandan sonra Google Search Console-a təqdim et. |
| **Open Graph** | ✅ | Hər səhifədə `og:title`, `og:description`, `og:url`, `og:image` + Twitter Card meta var. |
| **Şəkillərin lazy load** | ✅ (hazır) | Hazırda saytda real `<img>` yoxdur — hamısı placeholder (`.img-slot`). Real şəkil əlavə edəndə `<img loading="lazy" alt="...">` formatında əlavə olunmalıdır (aşağıya bax). |
| **Robots.txt** | ✅ | `robots.txt` yaradıldı və sitemap-a keçid verir. |
| **Schema kod** | ✅ | JSON-LD schema hər səhifədə var: `EducationalOrganization` (bütün səhifələr) + `BreadcrumbList` (alt-səhifələr) + `Course` (kurs səhifələri). |

## 2. "Admin paneldə olmalı" (redaktə interfeysi tələb edir)

| PDF bəndi | Status | Nə lazımdır |
|-----------|--------|-------------|
| **Header və Footer inputu** (head-ə kod yapışdırma) | 🔧 CMS | Admin paneldə `<head>` və `</body>` öncəsinə kod yapışdırma sahəsi. Statik saytda kodu birbaşa fayla əlavə edirik; "yapışdırma sahəsi" backend tələb edir. |
| **Robots.txt-i admindən yükləmək** (Word → upload) | 🔧 CMS | Fayl **var** və işləyir. Admindən Word/mətn yükləyib robots.txt kimi göstərmək üçün fayl-yükləmə backend-i lazımdır. |
| **Hər səhifəyə Meta title / description yazma sahəsi** | 🔧 CMS | Dəyərlər **hazırda hər səhifədə var**. Onları admin paneldən redaktə etmək üçün CMS lazımdır. |
| **Bloq redaktoru** — başlıqları H1/H2 təyin etmə, sözlərə link vermə | 🔧 CMS | Zəngin mətn (WYSIWYG) redaktoru + verilənlər bazası tələb edir. Statik `bloq.html` / `blogyazi.html` nümunə kimi qalır. |
| **Schema kod redaktə sahəsi** | 🔧 CMS | Schema **kodda var**. Admindən redaktə üçün backend lazımdır. |
| **Şəkil yükləmə — maksimum 500KB limit** | 🔧 CMS | Fayl-yükləmə + ölçü yoxlaması server/CMS tərəfində olur. |
| **Şəkil adından avtomatik `img alt`** | 🔧 CMS | Yükləmə zamanı fayl adını `alt`-a yazmaq üçün backend lazımdır. Statik halda `alt`-ı əl ilə yazırıq. |

---

## Real şəkil əlavə edərkən (statik halda SEO qaydası)

Placeholder `.img-slot` bloklarını real şəkillə əvəz edəndə **həmişə** bu formatı işlət:

```html
<img src="assets/ingilis-dili-kursu.jpg"
     alt="İngilis dili kursu — British Academy"
     loading="lazy" width="800" height="600">
```

- `loading="lazy"` — lazy load (PDF tələbi).
- `alt` — şəkil adı / təsviri (PDF tələbi: "şəkil adı avtomatik alt").
- `width`/`height` — layout sıçrayışının qarşısını alır (Core Web Vitals).
- Ölçü: yükləməzdən əvvəl şəkli **≤ 500KB** sıxışdır (PDF tələbi).
- `og:image` üçün kök qovluğa `og-cover.jpg` (təxminən 1200×630) əlavə et.

## CMS-ə keçid tövsiyəsi
🔧 işarəli bütün bəndlər standart CMS xüsusiyyətləridir. İki yol var:
1. **WordPress** — Yoast/RankMath SEO plagini yuxarıdakı admin bəndlərinin (head kod, meta, schema, robots, sitemap, şəkil alt/limit, bloq redaktoru) hamısını qarşılayır. Bu dizaynı WordPress şablonuna köçürmək lazımdır.
2. **Headless CMS** (Strapi / Sanity) + bu statik front-end — daha çox iş, daha çevik.

Domain dəyişəndə: `tools/build.mjs` başındakı `ORIGIN` dəyərini dəyiş və `node tools/build.mjs` işə sal — bütün canonical/OG/sitemap avtomatik yenilənir.
