// ── i18n (çoxdilli məzmun) ──
// Məzmun sahələri { az, en, ru } obyekti kimi saxlanılır. Public API cavabları
// seçilmiş dilə görə düz mətnə "yastılanır" (AZ fallback). Admin API isə tam
// { az, en, ru } obyektini qaytarır ki, forma 3 dili redaktə edə bilsin.
import { mongoose } from "#lib";

const { Mixed } = mongoose.Schema.Types;

export const LOCALES = ["az", "en", "ru"];
export const DEFAULT_LOCALE = "az";

/**
 * Model → tərcümə olunan sahələr. Miqrasiya scripti və i18nPlugin bu siyahını
 * istifadə edir. Yalnız mətn məzmunu (slug/rəng/url/email/şəkil/enum yox).
 */
export const LOCALIZED_FIELDS = {
  Course: [
    "title", "h1", "lead", "excerpt", "contentHtml", "pricingNote", "seo.metaTitle", "seo.metaDescription",
    "seo.keywords", "faq.$.question", "faq.$.answer", "info.$.label", "info.$.value", "customPricing.$.label",
    "customPricing.$.value", "features.$.title", "features.$.text", "content.$.heading", "content.$.body",
    "content.$.items", "content.$.definitions.$.term", "content.$.definitions.$.description",
    "pricing.$.note",
  ],
  CourseCategory: [
    "name", "description", "lead", "seo.metaTitle", "seo.metaDescription", "seo.keywords",
  ],
  Teacher: [
    "fullName", "title", "bio", "seo.metaTitle", "seo.metaDescription", "seo.keywords", "certificates.$.title",
    "stats.$.label", "stats.$.value",
  ],
  Branch: [
    "name", "address", "district", "metro", "seo.metaTitle", "seo.metaDescription", "seo.keywords",
    "workingHours.$.days",
  ],
  Destination: [
    "country", "region", "lead", "tagline", "contentHtml", "seo.metaTitle", "seo.metaDescription",
    "seo.keywords", "facts.$.label", "facts.$.value", "faq.$.question", "faq.$.answer", "content.$.heading",
    "content.$.body", "content.$.items", "content.$.definitions.$.term", "content.$.definitions.$.description",
    "universities.$.name", "universities.$.city",
  ],
  Quiz: [
    "title", "lead", "description", "ctaLabel", "seo.metaTitle", "seo.metaDescription", "seo.keywords",
    "questions.$.text", "questions.$.explanation", "questions.$.options.$.text",
    "levels.$.title", "levels.$.description",
  ],
  Page: [
    "title", "h1", "lead", "contentHtml", "seo.metaTitle", "seo.metaDescription", "seo.keywords",
    "facts.$.label", "facts.$.value", "faq.$.question", "faq.$.answer", "content.$.heading",
    "content.$.body", "content.$.items", "content.$.definitions.$.term", "content.$.definitions.$.description",
  ],
  Testimonial: [
    "achievement", "quote",
  ],
  Advantage: [
    "title", "text",
  ],
  Faq: [
    "question", "answer",
  ],
  BlogPost: [
    "title", "excerpt", "content", "tags", "seo.metaTitle", "seo.metaDescription", "seo.keywords",
  ],
  BlogCategory: [
    "name",
  ],
  MenuItem: [
    "label",
  ],
  Partner: [
    "name",
  ],
  CourseGroup: [
    "note",
  ],
  Media: [
    "alt",
  ],
  SiteSetting: [
    "hero.titlePrefix", "hero.subtitle", "hero.words", "hero.chipsLeft",
    "hero.chipsRight", "hero.pills", "marquee", "stats.$.label", "stats.$.value",
    "seo.defaultTitle", "seo.defaultDescription", "seo.keywords",
  ],
};

/**
 * Massiv kimi saxlanılan, indi isə dil üzrə MƏTN (vergüllə/sətirlə ayrılmış)
 * olan sahələr — miqrasiya bunları join edir, forma isə split/join ilə redaktə edir.
 */
export const LIST_LOCALIZED_FIELDS = new Set([
  "seo.keywords", "tags", "hero.words", "hero.chipsLeft", "hero.chipsRight",
  "hero.pills", "marquee", "content.$.items",
]);

/** Query/header dəyərini etibarlı dilə çevir (default: az). */
export const parseLocale = (v) => (LOCALES.includes(v) ? v : DEFAULT_LOCALE);

/**
 * Çoxdilli mətn sahəsi. Mixed olduğu üçün həm köhnə string dataya, həm də yeni
 * { az, en, ru } obyektinə icazə verir (miqrasiya rahat keçsin deyə).
 */
export const localizedField = () => ({ type: Mixed, default: "" });

const isPlainObj = (v) => v != null && typeof v === "object" && !Array.isArray(v);
/** { az/en/ru } formasında görünən obyektdirmi? */
export const looksLocalized = (v) => isPlainObj(v) && ("az" in v || "en" in v || "ru" in v);

/** İstənilən dəyəri { az, en, ru } formasına normallaşdır. */
export function normalizeLocalized(val) {
  if (val == null) return { az: "", en: "", ru: "" };
  if (typeof val === "string") return { az: val, en: "", ru: "" };
  if (looksLocalized(val)) return { az: val.az || "", en: val.en || "", ru: val.ru || "" };
  return { az: "", en: "", ru: "" };
}

/** Çoxdilli dəyərdən bir dili seç (AZ, sonra ilk dolu dil fallback). */
export function pickLocale(val, lang = DEFAULT_LOCALE) {
  if (!looksLocalized(val)) return val;
  return val[lang] || val.az || val.en || val.ru || "";
}

/** Yalnız sadə obyekt (POJO) — Date/ObjectId/Buffer və s. rekursiyaya düşməsin. */
function isPlainObject(v) {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const p = Object.getPrototypeOf(v);
  return p === Object.prototype || p === null;
}

/**
 * İxtiyari data-nı rekursiv gəz və { az,en,ru } formalı obyektləri seçilmiş
 * dildə mətnə çevir. Date/ObjectId/Mongoose-doc kimi obyektlər `toJSON` ilə
 * düzgün emal olunur (Date → ISO, ObjectId → hex) — dəyər itmir.
 */
export function deepLocalize(data, lang = DEFAULT_LOCALE) {
  if (data == null || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map((x) => deepLocalize(x, lang));
  if (looksLocalized(data)) return pickLocale(data, lang);

  // Date/ObjectId/Mongoose sənəd və s. → toJSON (Date→ISO, ObjectId→hex, doc→POJO)
  if (!isPlainObject(data) && typeof data.toJSON === "function") {
    const j = data.toJSON();
    return j === data ? data : deepLocalize(j, lang);
  }
  if (isPlainObject(data)) {
    const out = {};
    for (const k of Object.keys(data)) out[k] = deepLocalize(data[k], lang);
    return out;
  }
  return data;
}

/** Nested/array yol dəstəyi ilə obyektdə bir sahəni normallaşdır. */
function normalizePath(doc, path) {
  const [head, ...rest] = path.split(".");
  if (head === "$") {
    // array elementləri: "$.question" kimi
    if (Array.isArray(doc)) doc.forEach((el) => normalizePath(el, rest.join(".")));
    return;
  }
  if (!rest.length) {
    if (doc == null) return;
    const cur = typeof doc.get === "function" ? doc.get(head) : doc[head];
    // Faza 1: yalnız { az,en,ru } obyektlərini normallaşdır (açarları tamamla).
    // String-lərə toxunma ki, mövcud admin formaları (AZ) sınmasın —
    // string → obyekt çevrilməsi yalnız miqrasiya scripti ilə baş verir.
    if (!looksLocalized(cur)) return;
    const norm = normalizeLocalized(cur);
    if (typeof doc.set === "function") doc.set(head, norm);
    else doc[head] = norm;
    return;
  }
  const next = typeof doc.get === "function" ? doc.get(head) : doc[head];
  if (next != null) normalizePath(next, rest.join("."));
}

/**
 * Mongoose plugin — validate-dən əvvəl verilmiş çoxdilli yolları normallaşdırır
 * (string → { az }, obyekt → açarları tam). Beləcə həm seed string-ləri, həm
 * admin obyektləri işləyir.
 */
export function i18nPlugin(schema, { fields = [] } = {}) {
  schema.pre("validate", function () {
    for (const path of fields) {
      try { normalizePath(this, path); } catch { /* sahə yoxdursa ötür */ }
    }
  });
}
