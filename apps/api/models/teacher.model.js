// Constants
import { Schema, Model } from "#constants";

// Services
import { SlugService } from "#services";

// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS, pickLocale } from "#utils";

// Local
import { seoSchema, videoSchema, factSchema } from "./shared.schemas.js";

/**
 * Teacher — teaching staff.
 *
 * `branches` — müəllimin işlədiyi filiallar (siyahı səhifəsindəki filtr
 * bununla işləyir). Hansı KURSU keçdiyi kursun özündədir (Course.teachers):
 * əlaqə iki yerdə saxlanılanda biri köhnəlirdi.
 */
const certificateSchema = new Schema(
  {
    title: localizedField(),
    image: { type: String, trim: true },
    year: { type: Number },
  },
  { _id: false },
);

const teacherSchema = new Schema(
  {
    fullName: localizedField(),
    slug: { type: String, unique: true, index: true },

    // "IELTS 8.5 · İngilis dili" — shown under the name everywhere
    title: localizedField(),
    photo: { type: String, trim: true },
    // Fallback avatar tint when no photo is uploaded
    color: { type: String, trim: true, default: "#2E6BE6" },

    bio: localizedField(), // rich text (TipTap HTML)

    // Müəllimin işlədiyi filiallar. Hansı KURSU keçdiyi kursun özündə
    // saxlanılır (Course.teachers) — əlaqə tək yerdədir, ona görə burada
    // kurs siyahısı yoxdur.
    branches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],

    certificates: { type: [certificateSchema], default: [] },
    stats: { type: [factSchema], default: [] }, // təcrübə, tələbə sayı, bal
    introVideo: { type: videoSchema, default: undefined },

    socials: {
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },

    seo: { type: seoSchema, default: () => ({}) },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
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

teacherSchema.index({ isActive: 1, order: 1 });
teacherSchema.index({ branches: 1 });
teacherSchema.index({ courses: 1 });

teacherSchema.virtual("url").get(function () {
  return `/muellimler/${this.slug}`;
});

/** First letter, used by the UI when no photo exists. */
teacherSchema.virtual("initial").get(function () {
  return (pickLocale(this.fullName) || "?").trim().charAt(0).toUpperCase();
});

teacherSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Teacher });

teacherSchema.pre("save", async function () {
  if (!this.slug) {
    this.slug = await SlugService.unique(
      this.constructor,
      this.fullName,
      this._id,
    );
  }

});

teacherSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    fullName: 1,
  });
};

export const Teacher = Model("Teacher", teacherSchema);
