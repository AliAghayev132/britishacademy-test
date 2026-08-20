// Constants
import { Schema, Model } from "#constants";
// Services
import { SlugService } from "#services";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";
// Local schemas
import { seoSchema, contentBlockSchema, factSchema, faqItemSchema } from "./shared.schemas.js";

/**
 * Destination — a study-abroad country (Xaricdə təhsil) or a scholarship
 * programme (Taqaüd Proqramları, flagged via `isScholarship`).
 */
const universitySchema = new Schema(
  {
    name: localizedField(),
    city: localizedField(),
    url: { type: String, trim: true },
  },
  { _id: false },
);

const destinationSchema = new Schema(
  {
    country: localizedField(),
    slug: { type: String, unique: true, index: true },

    region: localizedField(), // "Avropa", "Şimali Amerika"
    // Inline SVG or asset path for the flag artwork used on the cards
    flag: { type: String },
    // Accent colour taken from the flag (card border/hover)
    color: { type: String, trim: true, default: "#2E6BE6" },

    lead: localizedField(),
    tagline: localizedField(), // "Ödənişsiz universitetlər"

    content: { type: [contentBlockSchema], default: [] },
    contentHtml: localizedField(), // rich-text body (TipTap); rendered when set, else `content` blocks
    facts: { type: [factSchema], default: [] }, // təhsil dili, viza, haqq
    universities: { type: [universitySchema], default: [] },
    faq: { type: [faqItemSchema], default: [] },

    image: { type: String, trim: true },

    isScholarship: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false }, // homepage grid

    seo: { type: seoSchema, default: () => ({}) },
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

destinationSchema.index({ isActive: 1, order: 1 });
destinationSchema.index({ isScholarship: 1, isActive: 1 });

destinationSchema.virtual("url").get(function () {
  return `/xaricde-tehsil/${this.slug}`;
});

destinationSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Destination });

destinationSchema.pre("save", async function () {
  if (!this.slug) {
    this.slug = await SlugService.unique(
      this.constructor,
      this.country,
      this._id,
    );
  }

});

destinationSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    country: 1,
  });
};

export const Destination = Model("Destination", destinationSchema);
