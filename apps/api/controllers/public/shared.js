// Public controller-lərin ortaq köməkçiləri (populate süzgəci, kart sahələri,
// təhlükəsiz tənzimləmələr).

/**
 * Silinmiş və ya deaktiv edilmiş əlaqəli sənəd populate-da çıxmasın
 * (audit #40). Əvvəl kurs səhifəsində silinmiş filialın qiyməti, müəllim
 * kartında silinmiş kurs, cədvəldə silinmiş müəllim görünürdü.
 */
const LIVE = { isActive: true, isDeleted: false };
const live = (path, select) => ({ path, select, match: LIVE });

/** populate match-dən sonra istinadı boş qalan sətirləri at (POJO qaytarır). */
const dropDangling = (doc, field, ref) => {
  const obj = typeof doc?.toJSON === "function" ? doc.toJSON() : doc;
  if (obj && Array.isArray(obj[field])) obj[field] = obj[field].filter((row) => row?.[ref]);
  return obj;
};

/**
 * Siyahı və kart sorğularında QAYTARILMAYAN ağır sahələr.
 *
 * Kartlar bunları işlətmir; onlar yalnız detal endpoint-lərinə (/:slug)
 * lazımdır. Əvvəl siyahılar tam sənəd qaytarırdı və Next onları klient
 * komponentlərinə (ölkə kartları, kurs vitrini, menyu) ötürürdü — hər
 * ölkənin mətni, FAQ-ı və SEO-su ana səhifə daxil HƏR səhifənin HTML-inə
 * yazılırdı (audit #15).
 */
const CARD_EXCLUDE = "-contentHtml -content -faq -seo";

/**
 * Public cavabdan çıxarılan sahələr.
 *
 * ⚠️ TƏHLÜKƏSİZLİK: /api/site autentifikasiyasızdır. SiteSetting sənədini olduğu
 * kimi qaytarmaq SMTP parolunu və OpenRouter API açarını hər kəsə açırdı.
 * Bura yalnız saytın işləməsi üçün lazım olanlar qalır; yeni gizli sahə əlavə
 * ediləndə onu da bu siyahıya yazın.
 */
const PRIVATE_SETTING_FIELDS = ["smtp", "ai"];

/** SiteSetting-i public üçün təhlükəsiz hala gətir. */
function publicSettings(doc) {
  const out = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  for (const f of PRIVATE_SETTING_FIELDS) delete out[f];
  return out;
}

export { LIVE, live, dropDangling, CARD_EXCLUDE, PRIVATE_SETTING_FIELDS, publicSettings };
