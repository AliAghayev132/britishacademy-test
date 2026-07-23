import { Schema, Model, mediaTypes } from "#constants";

/**
 * Media — the upload library. The desktop filename becomes the default `alt`
 * text, and the media endpoint enforces the ≤500 KB image limit — both are
 * requirements from the client's technical brief.
 */
const mediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    // Default alt derived from the original filename; editable per use.
    alt: { type: String, trim: true, default: "" },
    type: { type: String, enum: mediaTypes, default: "image" },
    mimeType: { type: String, trim: true },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

mediaSchema.index({ createdAt: -1 });

export const Media = Model("Media", mediaSchema);
