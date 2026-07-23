import { Schema, Model, cefrLevels, pricingModes } from "#constants";
import { SlugService } from "#services/SlugService.js";
import {
  seoSchema,
  contentBlockSchema,
  faqItemSchema,
  factSchema,
  featureSchema,
} from "./shared.schemas.js";

/**
 * Course — the main content type.
 *
 * Everything the static course pages render lives here: hero copy, ordered body
 * blocks, the FAQ accordion (also emitted as FAQPage JSON-LD), the info card,
 * feature cards, and the per-branch price matrix.
 */

/** One branch row of the price table: group/individual × day/evening. */
const branchPriceSchema = new Schema(
  {
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    group: {
      day: { type: Number, min: 0 },
      evening: { type: Number, min: 0 },
    },
    individual: {
      day: { type: Number, min: 0 },
      evening: { type: Number, min: 0 },
    },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CourseCategory",
      required: true,
    },

    // Hero
    h1: { type: String, trim: true }, // long SEO headline; falls back to title
    lead: { type: String, trim: true },
    excerpt: { type: String, trim: true },

    // Ordered body copy
    content: { type: [contentBlockSchema], default: [] },
    faq: { type: [faqItemSchema], default: [] },
    info: { type: [factSchema], default: [] }, // "Qısa məlumat" card
    features: { type: [featureSchema], default: [] }, // "Üstünlüklər"

    // Programme facts
    levels: { type: [String], enum: cefrLevels, default: [] },
    lesson: {
      perWeek: { type: Number, default: 2 },
      minutes: { type: Number, default: 90 },
      levelDurationMonths: { type: [Number], default: [1.5, 2] }, // [min, max]
    },
    groupSize: {
      min: { type: Number, default: 3 },
      max: { type: Number, default: 6 },
    },

    // Pricing
    pricingMode: { type: String, enum: pricingModes, default: "branch" },
    pricing: { type: [branchPriceSchema], default: [] },
    // pricingMode: 'custom' — session-based prices (e.g. conversation clubs)
    customPricing: { type: [factSchema], default: [] },
    pricingNote: { type: String, trim: true },
    currency: { type: String, default: "AZN" },

    image: { type: String, trim: true },
    gallery: { type: [String], default: [] },
    icon: { type: String, trim: true },

    seo: { type: seoSchema, default: () => ({}) },
    isFeatured: { type: Boolean, default: false }, // homepage card
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseSchema.index({ category: 1, order: 1 });
courseSchema.index({ isActive: 1, isFeatured: 1 });

courseSchema.virtual("url").get(function () {
  return `/kurslar/${this.slug}`;
});

/** Scheduled groups for this course (populate when the timetable is needed). */
courseSchema.virtual("groups", {
  ref: "CourseGroup",
  localField: "_id",
  foreignField: "course",
});

/** Cheapest advertised group price — used for "from X AZN" badges. */
courseSchema.virtual("priceFrom").get(function () {
  const values = (this.pricing || [])
    .map((p) => p?.group?.day)
    .filter((v) => typeof v === "number" && v > 0);
  return values.length ? Math.min(...values) : null;
});

courseSchema.pre("save", async function () {
  if (!this.slug && this.title) {
    this.slug = await SlugService.unique(this.constructor, this.title, this._id);
  }

});

courseSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    title: 1,
  });
};

/** Courses shown on the homepage. */
courseSchema.statics.findFeatured = function (limit = 6) {
  return this.find({ isActive: true, isDeleted: false, isFeatured: true })
    .sort({ order: 1 })
    .limit(limit);
};

export const Course = Model("Course", courseSchema);
