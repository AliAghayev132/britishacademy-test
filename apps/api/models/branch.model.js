import { Schema, Model } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { seoSchema } from "./shared.schemas.js";

/**
 * Branch — a physical British Academy location.
 *
 * Drives: the Filiallar page, the per-branch price matrix on every course page,
 * the WhatsApp branch picker, and the footer/contact details.
 */
const workingHourSchema = new Schema(
  {
    days: { type: String, required: true, trim: true }, // "B.e–Cümə"
    from: { type: String, required: true, trim: true }, // "09:00"
    to: { type: String, required: true, trim: true }, // "21:00"
  },
  { _id: false },
);

const branchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    address: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    metro: { type: String, trim: true },

    phone: { type: String, trim: true },
    // Digits only, e.g. "994552124151" — used to build wa.me links.
    whatsapp: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    workingHours: { type: [workingHourSchema], default: [] },
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    mapEmbedUrl: { type: String, trim: true },

    images: { type: [String], default: [] },

    // The head office (Caspian Plaza) — some courses run only here.
    isMain: { type: Boolean, default: false },

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

branchSchema.index({ isActive: 1, order: 1 });

branchSchema.virtual("url").get(function () {
  return `/filiallar/${this.slug}`;
});

branchSchema.virtual("whatsappUrl").get(function () {
  return this.whatsapp ? `https://wa.me/${this.whatsapp}` : null;
});

branchSchema.pre("save", async function (next) {
  if (!this.slug && this.name) {
    this.slug = await SlugService.unique(this.constructor, this.name, this._id);
  }
  next();
});

branchSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    name: 1,
  });
};

export const Branch = Model("Branch", branchSchema);
