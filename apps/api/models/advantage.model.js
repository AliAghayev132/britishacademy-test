import { Schema, Model } from "#constants";
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";

/** Advantage — the numbered "Üstünlüklərimiz" cards on the homepage. */
const advantageSchema = new Schema(
  {
    title: localizedField(),
    text: localizedField(),
    icon: { type: String, trim: true }, // svg path id or icon name
    color: { type: String, trim: true, default: "#7C4DFF" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

advantageSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Advantage });

advantageSchema.statics.findPublic = function () {
  return this.find({ isActive: true, isDeleted: false }).sort({ order: 1 });
};

export const Advantage = Model("Advantage", advantageSchema);
