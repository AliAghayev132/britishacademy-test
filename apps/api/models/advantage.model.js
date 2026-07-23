import { Schema, Model } from "#constants";

/** Advantage — the numbered "Üstünlüklərimiz" cards on the homepage. */
const advantageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, trim: true },
    icon: { type: String, trim: true }, // svg path id or icon name
    color: { type: String, trim: true, default: "#7C4DFF" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

advantageSchema.statics.findPublic = function () {
  return this.find({ isActive: true, isDeleted: false }).sort({ order: 1 });
};

export const Advantage = Model("Advantage", advantageSchema);
