import { Schema, Model } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { seoSchema, videoSchema, factSchema } from "./shared.schemas.js";

/**
 * Teacher — teaching staff.
 *
 * `branches` and `courses` are the denormalised "who works where / teaches what"
 * links used by the site. The authoritative per-timetable assignment lives in
 * CourseGroup; these arrays exist so listing pages can filter without joining
 * through the schedule.
 */
const certificateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    year: { type: Number },
  },
  { _id: false },
);

const teacherSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    // "IELTS 8.5 · İngilis dili" — shown under the name everywhere
    title: { type: String, trim: true },
    photo: { type: String, trim: true },
    // Fallback avatar tint when no photo is uploaded
    color: { type: String, trim: true, default: "#2E6BE6" },

    bio: { type: String }, // rich text (TipTap HTML)

    branches: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],

    certificates: { type: [certificateSchema], default: [] },
    stats: { type: [factSchema], default: [] }, // təcrübə, tələbə sayı, bal
    introVideo: { type: videoSchema, default: undefined },

    socials: {
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },

    seo: { type: seoSchema, default: () => ({}) },
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
  return (this.fullName || "?").trim().charAt(0).toUpperCase();
});

teacherSchema.pre("save", async function (next) {
  if (!this.slug && this.fullName) {
    this.slug = await SlugService.unique(
      this.constructor,
      this.fullName,
      this._id,
    );
  }
  next();
});

teacherSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    fullName: 1,
  });
};

export const Teacher = Model("Teacher", teacherSchema);
