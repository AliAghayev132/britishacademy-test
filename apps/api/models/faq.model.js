import { Schema, Model } from "#constants";

/**
 * Faq — site-wide questions (homepage FAQ section). Course- and destination-
 * specific FAQs live embedded on those documents; this collection is for the
 * general list only.
 */
const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    // Optional grouping, e.g. "Qeydiyyat", "Ödəniş"
    group: { type: String, trim: true },
    color: { type: String, trim: true, default: "#7C4DFF" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

faqSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
  });
};

export const Faq = Model("Faq", faqSchema);
