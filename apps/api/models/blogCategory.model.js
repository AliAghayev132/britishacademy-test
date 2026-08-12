import { Schema, Model } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";

/** BlogCategory — the chip filter on the Bloq page. */
const blogCategorySchema = new Schema(
  {
    name: localizedField(),
    slug: { type: String, unique: true, index: true },
    color: { type: String, trim: true, default: "#2E6BE6" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } },
);

blogCategorySchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.BlogCategory });

blogCategorySchema.pre("save", async function () {
  if (!this.slug) {
    this.slug = await SlugService.unique(this.constructor, this.name, this._id);
  }

});

blogCategorySchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
  });
};

export const BlogCategory = Model("BlogCategory", blogCategorySchema);
