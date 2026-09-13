/**
 * JSON-LD üçün təhlükəsiz sətir — `<script type="application/ld+json">` içinə.
 *
 * ── NİYƏ ──
 * `JSON.stringify` `<` simvolunu escape ETMİR. Kurs, bloq və ya FAQ başlığında
 * `</script><script>…` olsaydı, brauzer skripti orada bağlayıb qalanını HTML
 * kimi icra edərdi — ictimai saytda, admin tokenləri ilə eyni origin-də.
 * `<` → `\u003c` JSON olaraq eyni dəyərdir, amma HTML parser onu teq saymır
 * (Next.js sənədlərinin tövsiyə etdiyi üsul). Bu skript JavaScript kimi icra
 * olunmur, ona görə başqa simvolu escape etməyə ehtiyac yoxdur.
 */
// Escape forması: tərs xətt (kod 92) + "u003c". Mənbədə tərs xətt hərfi
// yazılmır — bir dəfə itib replace-i heç nə etməyən hala salmışdı.
const LT_ESCAPE = String.fromCharCode(92) + "u003c";

export const ldJson = (data) => JSON.stringify(data).split("<").join(LT_ESCAPE);
