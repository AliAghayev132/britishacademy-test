import { Schema, Model } from "#constants";

/** Partner — corporate partner logos in the "Tərəfdaşlarımız" strip. */
const partnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, trim: true },
    url: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

partnerSchema.statics.findPublic = function () {
  return this.find({ isActive: true, isDeleted: false }).sort({ order: 1 });
};

export const Partner = Model("Partner", partnerSchema);
