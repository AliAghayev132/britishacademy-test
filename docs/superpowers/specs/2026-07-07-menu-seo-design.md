# British Academy — Menyu strukturu + Statik SEO (dizayn)

**Tarix:** 2026-07-07
**Mənbə:** `British Academy - Sayfa1.pdf` (müştəri texniki tapşırığı)
**Sayt tipi:** Təmiz statik HTML/CSS/JS (framework/backend yoxdur).

## Məqsəd
PDF-dəki tələbləri mövcud statik sayta tətbiq etmək:
1. Naviqasiyanı PDF-in "Menu Bar" strukturuna uyğun tam yenidən qurmaq (mega-menyu + açılan menyular + mobil menyu).
2. Hər kurs/alt-kateqoriya üçün ayrıca səhifə yaratmaq.
3. Statik faylda mümkün olan bütün SEO işlərini görmək.
4. Yalnız admin-panel/CMS tələb edən bəndləri ayrıca sənəddə qeyd etmək.

## Arxitektura
50+ səhifə eyni mega-menyunu paylaşdığı üçün naviqasiya **tək mənbədən** idarə olunur:
- `tools/build.mjs` — konfiqurasiya (domain + tam menyu ağacı) + səhifə şablonları + generator.
- Generator **tam təmiz statik HTML** çıxarır — deploy üçün heç bir build addımı lazım deyil.
- Paylaşılan `css/style.css` (mega-menyu stilləri) və `js/main.js` (dropdown/mobil/aktiv-menyu davranışı).
- Mövcud 6 səhifə generator tərəfindən avtomatik patch olunur (nav bloku + SEO tag-ları).

`SITE.origin` tək yerdə (`tools/build.mjs` başında) saxlanılır — domain dəyişəndə bir sətir dəyişir, sonra generator yenidən işə salınır.

## Menyu strukturu (PDF-ə uyğun)
- Haqqımızda
- Uşaq Proqramları (hub, box layout) → İngilis dili · Rus dili · Məntiq
- Xidmətlər (mega-menyu, hub)
  - Dil Kursları (hub, box layout): İngilis (İngilis dili, Biznes, Hüquqşünaslar, Otel və Turizm), Alman (Alman dili, Beynəlxalq Sertifikatlı), Rus, İspan, İtalyan, Fransız
  - Danışıq Klubları və Praktika: Conversation Club · Workshop
  - Beynəlxalq imtahanlara hazırlıq: IELTS · TOEFL · OET · TOEIC · SAT · Duolingo · TOLES
  - Peşəkar Sertifikat Proqramları: TEFL
  - Kompüter Kursu: MS Office · Peşəkar Excel
  - Karyera kursları: Mühasibatlıq və 1C · HR & Kargüzarlıq
- Tələbələrə özəl: Dinləmə günü · Film günü
- Xaricdə təhsil (hub, box layout): Almaniya, Türkiyə, Polşa, Latviya, Macarıstan, Litva, Rusiya, Gürcüstan, İngiltərə, Kanada, Estoniya
- Taqaüd Proqramları
- Əlaqə

Mövcud "Müəllimlər" və "Bloq" səhifələri PDF menyusunda yoxdur → footer-də saxlanılır (orfan qalmasın).

## Səhifə şablonları
- **Kurs (leaf):** hero (breadcrumb + başlıq + lead) → "Kurs haqqında" (mətn + info kart) → üstünlüklər → nə əldə edəcəksən → CTA → əlaqəli kurslar. Məzmun placeholder — müştəri sonra doldurur.
- **Hub (box/shape):** hero → box grid (alt-kateqoriyalara keçid) → CTA.
- **Əlaqə:** əlaqə kartları + xəritə placeholder + forma.
- **Sadə:** Taqaüd Proqramları.

## Statik SEO (hər səhifədə)
- `<link rel="canonical">` — hər səhifə üçün mütləq URL.
- Open Graph + Twitter Card meta.
- JSON-LD: `EducationalOrganization` (bütün səhifə) + `BreadcrumbList` (alt-səhifə) + `Course` (kurs səhifələri).
- Unikal `<title>` + `<meta name="description">`.
- Şəkillərdə `loading="lazy"` + `alt`.
- `sitemap.xml` (generasiya) + `robots.txt` (generasiya).
- `lang="az"`, viewport, charset.

## Admin-panel bəndləri (statik saytda mümkün DEYİL — sənədləşdirilir)
`docs/ADMIN-PANEL-TELEBLERI.md` faylında: head-ə kod input sahəsi, robots.txt yükləmə widget-i, 500KB şəkil limiti, fayl adından avto `img alt`, bloq H1/H2 redaktoru + söz linkləmə. Bunlar CMS/backend tələb edir.

## Nəticə faylları
- ~52 yeni `.html` səhifə
- 6 mövcud səhifə patch (nav + SEO)
- `css/style.css` + `js/main.js` genişləndirilir
- `sitemap.xml`, `robots.txt`
- `docs/ADMIN-PANEL-TELEBLERI.md`
- `tools/build.mjs` (dev generator — deploy üçün lazım deyil)
