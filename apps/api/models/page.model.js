import { Schema, Model } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { seoSchema, contentBlockSchema, factSchema, faqItemSchema } from "./shared.schemas.js";

/**
 * Page — editorial pages that are not courses or destinations
 * (Haqqımızda, Əlaqə copy, Tələbələrə özəl, …).
 *
 * `isSystem` marks pages the app routes to by a fixed slug so the admin cannot
 * delete or rename them out from under the code.
 */
const pageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    h1: { type: String, trim: true },
    lead: { type: String, trim: true },
    content: { type: [contentBlockSchema], default: [] },
    facts: { type: [factSchema], default: [] },
    faq: { type: [faqItemSchema], default: [] },

    cover: { type: String, trim: true },
    mascot: { type: String, trim: true },

    seo: { type: seoSchema, default: () => ({}) },
    isSystem: { type: Boolean, default: false },
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

pageSchema.virtual("url").get(function () {
  return `/${this.slug}`;
});

pageSchema.pre("save", async function (next) {
  if (!this.slug && this.title) {
    this.slug = await SlugService.unique(this.constructor, this.title, this._id);
  }
  next();
});

pageSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
  });
};

export const Page = Model("Page", pageSchema);
