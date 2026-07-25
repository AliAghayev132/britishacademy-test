# Maskot şəkilləri (statik sayt)

Bu qovluğa maskot PNG-lərini at — sayt avtomatik götürəcək.
Fayl yoxdursa heç nə sınmır: şəkil sadəcə görünmür (`onerror` ilə silinir).

**Vacib:** adlar dinamik sayt (`apps/web/public/assets/mascot/`) ilə **eynidir**.
Yəni bir dəst maskot düzəldib **hər iki qovluğa** eyni faylları atmaq kifayətdir.

| Fayl adı | Poza (təklif) | Harada görünür |
|----------|---------------|----------------|
| `hero.png`         | Salamlayan / thumbs-up            | Ana səhifə hero (sağ alt) · CTA blokları |
| `courses.png`      | Kitab tutan                       | Kurslar hub + bütün kurs səhifələri |
| `teachers.png`     | Lövhə/işarə çubuğu ilə            | (dinamik saytda müəllim səhifəsi) |
| `filiallar.png`    | Xəritəni göstərən                 | Filiallar səhifəsi |
| `students.png`     | Məzun papağı ilə                  | Tələbələrimiz səhifəsi |
| `destinations.png` | **Əlində plakat/çamadan**         | Xaricdə təhsil hub + ölkə səhifələri |
| `blog.png`         | Oxuyan                            | (dinamik saytda bloq səhifəsi) |
| `contact.png`      | Qulaqlıq / əl edən                | Əlaqə səhifəsi |
| `about.png`        | Əl edib salamlayan                | Haqqımızda · axtarışda «Nəticə tapılmadı» |

Loader (səhifə yüklənərkən) ayrıca maskot **tələb etmir** — hazırda **loqonu**
«gedirmiş kimi» yellədir (`.ba-loader-walk` animasiyası).

## Ölçü tələbləri

- **Format:** PNG, şəffaf fon (transparent background)
- **Ölçü:** kvadrat, **~800×800 px**; saytda banner-də ~190–250 px göstərilir
- Maskot **aşağı-mərkəzə** oturur (ayaqları aşağıda) — kompozisiyanı buna görə qur
- **Həcm:** hər fayl **500 KB-dan az** olmalıdır
- Mobil (< 680 px) maskot avtomatik gizlənir ki, mətnlə toqquşmasın

## Yeni səhifəyə maskot vermək

`tools/build.mjs` içində səhifə reyestrində `mascot: 'ad'` ver — `hero()`
banner-də avtomatik `assets/mascot/ad.png`-i göstərəcək.
