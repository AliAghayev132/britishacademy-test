# Tələbə profil şəkilləri

`telebelerimiz.html` səhifəsindəki rəy kartlarında profil şəkli göstərilir.
Şəkil yoxdursa, tələbənin adının **ilk hərfi rəngli dairədə** görünür — dizayn pozulmur.

## Fayl adları

Ad-soyad kiçik hərflərlə, Azərbaycan hərfləri latına çevrilmiş, boşluq yerinə `-`, uzantı `.jpg`:

| Tələbə | Fayl adı |
|--------|----------|
| Leyla Hüseynova | `leyla-huseynova.jpg` |
| Elvin Səfərov | `elvin-seferov.jpg` |
| Günel Rzayeva | `gunel-rzayeva.jpg` |
| Tural Abbasov | `tural-abbasov.jpg` |
| Aynur Kərimli | `aynur-kerimli.jpg` |
| Kamran Əliyev | `kamran-eliyev.jpg` |
| Səbinə Nəbiyeva | `sebine-nebiyeva.jpg` |
| Orxan Məmmədli | `orxan-memmedli.jpg` |
| Fidan Qasımova | `fidan-qasimova.jpg` |

## Tələblər

- **Kvadrat** şəkil (1:1) — dairə şəklində kəsilir
- ~400×400 px kifayətdir
- **500 KB-dan az** olmalıdır
- Üz mərkəzdə olsun (kənarları kəsilir)

## Rəyləri dəyişmək

Mətnlər və adlar `tools/build.mjs` faylındakı `TEXT_REVIEWS` və `VIDEO_REVIEWS`
massivlərindədir. Dəyişdikdən sonra `node tools/build.mjs` işə sal.
Yeni tələbə əlavə edəndə fayl adı yuxarıdakı qaydaya uyğun olmalıdır.
