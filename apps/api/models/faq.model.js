// Constants
import { Schema, Model } from "#constants";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";

/**
 * Faq — site-wide questions (homepage FAQ section). Course- and destination-
 * specific FAQs live embedded on those documents; this collection is for the
 * general list only.
 */
const faqSchema = new Schema(
  {
    question: localizedField(),
    answer: localizedField(),
    // Optional grouping, e.g. "Qeydiyyat", "Ödəniş"
    group: { type: String, trim: true },
    color: { type: String, trim: true, default: "#7C4DFF" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

faqSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Faq });

faqSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
  });
};

export const Faq = Model("Faq", faqSchema);
