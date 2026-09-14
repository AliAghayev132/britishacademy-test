// Constants
import { Schema, Model, leadStatus, leadSources } from "#constants";

/**
 * Lead — a submission from the "Müraciət et" modal or the contact form.
 *
 * The static site only showed an alert() and dropped the enquiry; every
 * submission now lands here with a simple sales pipeline.
 */
const leadSchema = new Schema(
  {
    // Uzunluq limitləri: ictimai formadır. Əvvəl limit yox idi — meqabaytlıq
    // «ad» və ya «mesaj» bazaya və bildiriş məktubuna düşə bilərdi.
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },

    course: { type: Schema.Types.ObjectId, ref: "Course" },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    // Free-text interest when the visitor did not pick a real course
    interest: { type: String, trim: true, maxlength: 200 },
    // Xaricdə təhsil müraciətlərində seçilən ölkələr.
    //
    // Ayrıca sahədir, `message` içinə mətn kimi yazılmır: admin panel bunlara
    // görə süzgəc qura bilsin və hansı ölkənin nə qədər maraq gördüyü
    // statistikada görünsün.
    destinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    // Layihə müraciətləri — YALNIZ layihənin öz səhifəsindən doldurulur.
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    message: { type: String, trim: true, maxlength: 3000 },

    source: { type: String, enum: leadSources, default: "apply-modal" },
    // Page the form was submitted from, for attribution
    pageUrl: { type: String, trim: true, maxlength: 500 },

    status: { type: String, enum: leadStatus, default: "new" },
    note: { type: String, trim: true, maxlength: 3000 },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } },
);

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ createdAt: -1 });
// Admin siyahısı həmişə `isDeleted: false` ilə süzüb tarixə görə düzür;
// filial meneceri isə öz filialı ilə (bax applyLeadScope).
leadSchema.index({ isDeleted: 1, createdAt: -1 });
leadSchema.index({ branch: 1, createdAt: -1 });

leadSchema.methods.markHandled = async function (userId, status = "contacted") {
  this.status = status;
  this.handledBy = userId;
  this.handledAt = new Date();
  await this.save();
  return this;
};

export const Lead = Model("Lead", leadSchema);
