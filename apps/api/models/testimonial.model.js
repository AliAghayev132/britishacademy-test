import { Schema, Model, testimonialTypes } from "#constants";
import { videoSchema } from "./shared.schemas.js";

/**
 * Testimonial — graduate feedback shown on the Tələbələrimiz page and,
 * when `isFeatured`, on the homepage.
 *
 * `type: 'video'` renders a player card, `type: 'text'` renders a review card
 * with avatar, star rating and quote.
 */
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, trim: true },
    // Avatar tint used when no photo is uploaded (initial on a coloured circle)
    color: { type: String, trim: true, default: "#2E6BE6" },

    type: { type: String, enum: testimonialTypes, default: "text" },

    course: { type: Schema.Types.ObjectId, ref: "Course" },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    // Free-text label under the name, e.g. "IELTS Hazırlıq · 7.5 bal"
    achievement: { type: String, trim: true },

    // type: 'text'
    quote: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },

    // type: 'video'
    video: { type: videoSchema, default: undefined },

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

testimonialSchema.index({ type: 1, isActive: 1, order: 1 });
testimonialSchema.index({ isFeatured: 1, isActive: 1 });

testimonialSchema.virtual("initial").get(function () {
  return (this.name || "?").trim().charAt(0).toUpperCase();
});

testimonialSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    createdAt: -1,
  });
};

export const Testimonial = Model("Testimonial", testimonialSchema);
