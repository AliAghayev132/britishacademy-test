import { Schema, Model, postStatus } from "#constants";
import { SlugService } from "#services/SlugService.js";
import { seoSchema } from "./shared.schemas.js";

/**
 * BlogPost — articles. Body is TipTap-produced HTML, which satisfies the
 * client brief's "choose H1/H2 headings and link words" requirement.
 */
const blogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, trim: true },
    content: { type: String, default: "" }, // sanitized HTML

    cover: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    tags: { type: [String], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User" },

    readMinutes: { type: Number, default: 3 },
    views: { type: Number, default: 0 },

    status: { type: String, enum: postStatus, default: "draft" },
    publishedAt: { type: Date },

    seo: { type: seoSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ category: 1, status: 1 });

blogPostSchema.virtual("url").get(function () {
  return `/bloq/${this.slug}`;
});

blogPostSchema.pre("save", async function (next) {
  if (!this.slug && this.title) {
    this.slug = await SlugService.unique(this.constructor, this.title, this._id);
  }
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

blogPostSchema.statics.findPublished = function (filter = {}) {
  return this.find({ ...filter, status: "published", isDeleted: false }).sort({
    publishedAt: -1,
  });
};

export const BlogPost = Model("BlogPost", blogPostSchema);
