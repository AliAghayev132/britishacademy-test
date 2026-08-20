import { Schema, contentBlockTypes } from "#constants";
// Utils
import { localizedField } from "#utils";

/**
 * Reusable sub-schemas shared by several models.
 * `_id: false` everywhere — these are value objects, not documents.
 *
 * Görünən bütün mətn sahələri `localizedField()`-dir ({ az, en, ru }). Siyahı
 * tipli sahələr (keywords, items, tags) hər dil üçün vergül/sətir ilə ayrılmış
 * MƏTN kimi saxlanılır — boş dil "" olduğuna görə AZ fallback-i işləyir
 * (boş massiv `[]` truthy olduğu üçün fallback-i sındırardı).
 */

/** Per-page SEO overrides. Empty fields fall back to SiteSetting defaults. */
export const seoSchema = new Schema(
  {
    metaTitle: localizedField(),
    metaDescription: localizedField(),
    keywords: localizedField(), // vergüllə ayrılmış açar sözlər (dil üzrə)
    ogImage: { type: String },
    canonical: { type: String, trim: true }, // override canonical URL (optional)
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

/**
 * One ordered block of page body copy. Mirrors the block types the static site
 * already renders (paragraph / bullet list / term+definition / callout / note).
 */
export const contentBlockSchema = new Schema(
  {
    type: { type: String, enum: contentBlockTypes, default: "paragraph" },
    heading: localizedField(),
    headingLevel: { type: Number, enum: [2, 3], default: 2 },
    body: localizedField(),
    // for type: 'list' — hər sətir bir bənd (dil üzrə)
    items: localizedField(),
    // for type: 'definitions' — [{ term, description }]
    definitions: {
      type: [
        new Schema(
          { term: localizedField(), description: localizedField() },
          { _id: false },
        ),
      ],
      default: undefined,
    },
  },
  { _id: false },
);

/** Question/answer pair — drives both the accordion UI and FAQPage JSON-LD. */
export const faqItemSchema = new Schema(
  {
    question: localizedField(),
    answer: localizedField(),
  },
  { _id: false },
);

/** Small label/value row (the "Qısa məlumat" card, country facts). */
export const factSchema = new Schema(
  {
    label: localizedField(),
    value: localizedField(),
  },
  { _id: false },
);

/** Icon + title + text feature card. */
export const featureSchema = new Schema(
  {
    icon: { type: String, trim: true },
    title: localizedField(),
    text: localizedField(),
  },
  { _id: false },
);

/** Embedded video reference (graduate testimonials, teacher intro). */
export const videoSchema = new Schema(
  {
    url: { type: String, trim: true },
    poster: { type: String, trim: true },
    durationSeconds: { type: Number, min: 0 },
  },
  { _id: false },
);
