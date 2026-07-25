# Maskot şəkilləri

Bu qovluğa maskot PNG-lərini at — sayt avtomatik götürəcək.
**Fayl yoxdursa heç nə sınmır**: yer boş qalır (qırıq şəkil ikonu görünmür), çünki
maskotlar CSS `background-image` kimi qoyulub.

## Fayl adları və hara düşür

| Fayl | Poza (təklif) | Harada görünür |
|------|---------------|----------------|
| `hero.png` | Salamlayan / thumbs-up | Ana səhifə hero (sağ alt) |
| `courses.png` | Kitab tutan | Kurslar + kurs/kateqoriya səhifələri |
| `teachers.png` | Lövhə/işarə çubuğu ilə | Müəllimlər səhifəsi |
| `filiallar.png` | Xəritəni göstərən | Filiallar səhifəsi |
| `students.png` | Məzun papağı ilə | Tələbələrimiz səhifəsi |
| `destinations.png` | **Əlində plakat/çamadan** | Xaricdə təhsil + ölkə səhifələri |
| `blog.png` | Oxuyan | Bloq səhifəsi |
| `contact.png` | Qulaqlıq / əl edən | Əlaqə səhifəsi |
| `about.png` | Əl edib salamlayan | Haqqımızda səhifəsi |
| `walk.png` | **Yeriyən** (yükləmə üçün) | Səhifə yüklənərkən loader (istəyə bağlı) |

## Ölçü tələbləri

**Banner maskotları** (`hero`, `courses`, `teachers`, `filiallar`, `students`,
`destinations`, `blog`, `contact`, `about`):
- **Kvadrat, ~800 × 800 px**, şəffaf fon (transparent PNG)
- Saytda hündürlük ~230–300 px göstərilir (en avtomatik), banner-in sağ altında
- Maskot **aşağı-mərkəzə** oturur (ayaqları aşağıda) — kompozisiyanı buna görə qur
- Hər fayl **< 500 KB**

**Loader maskotu** (`walk.png`, istəyə bağlı):
- ~600 × 600 px kvadrat, şəffaf fon, < 300 KB
- Verilməsə, loader hazırda **loqonu** («gedir» animasiyası ilə) göstərir

## Necə işləyir

- Banner maskotu: `PageBanner` komponenti `/assets/mascot/<ad>.png`-i CSS fon kimi
  qoyur. Mobil (< 680 px) gizlənir ki, mətnlə toqquşmasın.
- Loader: `RouteLoader` səhifələr arası keçiddə görünür. `walk.png` gələndə
  `RouteLoader.jsx`-də `shield.png` → `mascot/walk.png` dəyiş (bir sətir).

Yeni səhifəyə maskot əlavə etmək: `<PageBanner mascot="ad" />` — `ad`
`PageBanner.jsx`-dəki `MASCOTS` xəritəsinə görə fayla çevrilir.
