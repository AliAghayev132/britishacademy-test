import { Schema, Model, leadStatus, leadSources } from "#constants";

/**
 * Lead — a submission from the "Müraciət et" modal or the contact form.
 *
 * The static site only showed an alert() and dropped the enquiry; every
 * submission now lands here with a simple sales pipeline.
 */
const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },

    course: { type: Schema.Types.ObjectId, ref: "Course" },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    // Free-text interest when the visitor did not pick a real course
    interest: { type: String, trim: true },
    message: { type: String, trim: true },

    source: { type: String, enum: leadSources, default: "apply-modal" },
    // Page the form was submitted from, for attribution
    pageUrl: { type: String, trim: true },

    status: { type: String, enum: leadStatus, default: "new" },
    note: { type: String, trim: true },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ createdAt: -1 });

leadSchema.methods.markHandled = async function (userId, status = "contacted") {
  this.status = status;
  this.handledBy = userId;
  this.handledAt = new Date();
  await this.save();
  return this;
};

export const Lead = Model("Lead", leadSchema);
