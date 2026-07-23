import { Schema, contentBlockTypes } from "#constants";

/**
 * Reusable sub-schemas shared by several models.
 * `_id: false` everywhere — these are value objects, not documents.
 */

/** Per-page SEO overrides. Empty fields fall back to SiteSetting defaults. */
export const seoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    ogImage: { type: String },
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
    heading: { type: String, trim: true },
    headingLevel: { type: Number, enum: [2, 3], default: 2 },
    body: { type: String },
    // for type: 'list'
    items: { type: [String], default: undefined },
    // for type: 'definitions' — [{ term, description }]
    definitions: {
      type: [
        new Schema(
          { term: { type: String, trim: true }, description: { type: String } },
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
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

/** Small label/value row (the "Qısa məlumat" card, country facts). */
export const factSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/** Icon + title + text feature card. */
export const featureSchema = new Schema(
  {
    icon: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    text: { type: String },
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
