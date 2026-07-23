import { Schema, Model } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { seoSchema } from "./shared.schemas.js";

/**
 * CourseCategory — self-referencing tree that mirrors the Xidmətlər mega-menu.
 *
 *   Xidmətlər
 *     ├── Dil Kursları
 *     ├── Danışıq Klubları və Praktika
 *     ├── Beynəlxalq imtahanlara hazırlıq
 *     ├── Peşəkar Sertifikat Proqramları
 *     ├── Kompüter Kursu
 *     └── Karyera kursları
 *   Uşaq Proqramları  (top-level, its own hub page)
 */
const courseCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    parent: { type: Schema.Types.ObjectId, ref: "CourseCategory", default: null },

    description: { type: String },
    lead: { type: String },
    icon: { type: String, trim: true }, // emoji or icon name
    image: { type: String, trim: true },
    // Optional mascot shown on the hub page hero
    mascot: { type: String, trim: true },

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

courseCategorySchema.index({ parent: 1, order: 1 });

courseCategorySchema.virtual("url").get(function () {
  return `/kurslar/${this.slug}`;
});

/** Child categories (populate with .populate('children')). */
courseCategorySchema.virtual("children", {
  ref: "CourseCategory",
  localField: "_id",
  foreignField: "parent",
});

/** Courses that belong directly to this category. */
courseCategorySchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "category",
});

courseCategorySchema.pre("save", async function (next) {
  if (!this.slug && this.name) {
    this.slug = await SlugService.unique(this.constructor, this.name, this._id);
  }
  next();
});

courseCategorySchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    name: 1,
  });
};

/** Top-level categories with their children, ready for the mega-menu. */
courseCategorySchema.statics.findTree = function () {
  return this.find({ parent: null, isActive: true, isDeleted: false })
    .sort({ order: 1 })
    .populate({
      path: "children",
      match: { isActive: true, isDeleted: false },
      options: { sort: { order: 1 } },
    });
};

export const CourseCategory = Model("CourseCategory", courseCategorySchema);
