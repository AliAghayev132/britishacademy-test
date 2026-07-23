# Maskot şəkilləri

Bu qovluğa **5 fayl** at — sayt avtomatik onları götürəcək.
Fayl yoxdursa heç nə sınmır: şəkil sadəcə görünmür (`onerror` ilə silinir).

| Fayl adı | Hansı poza | Harada görünür |
|----------|-----------|----------------|
| `flag.png`  | Union Jack plaşı ilə qaçan | Ana səhifə hero (sağ alt) · Xaricdə təhsil səhifəsi |
| `gift.png`  | Hədiyyə qutusu tutan | Bütün səhifələrdəki «Hazırsan? Elə bu gün başla» CTA blokunda |
| `wave.png`  | Oturub əl edən | Axtarışda «Nəticə tapılmadı» · Uşaq Proqramları səhifəsi |
| `point.png` | Barmağı ilə göstərən | Filiallar səhifəsi |
| `run.png`   | Qaçan (ehtiyat) | Hazırda istifadə olunmur — ehtiyatda |

## Tələblər

- **Format:** PNG, şəffaf fon (transparent background)
- **Ölçü:** ~800×800 px kifayətdir (saytda 128–190 px göstərilir)
- **Həcm:** hər fayl **500 KB-dan az** olmalıdır (texniki tapşırıq şərti)
- Adlar **dəqiq** yuxarıdakı kimi olmalıdır (kiçik hərflərlə, `.png`)

## Ölçünü kiçiltmək

Şəkillər böyükdürsə, layihədəki generator ilə eyni üsulla kiçildə bilərsən —
və ya istənilən onlayn PNG sıxıcı (məs. tinypng.com) işə yarayar.

Yeni poza əlavə etmək istəsən: faylı bura at, sonra `tools/build.mjs`
içində `mascot('ad', 'ba-mascot-...')` çağırışı ilə istədiyin yerə yerləşdir.
