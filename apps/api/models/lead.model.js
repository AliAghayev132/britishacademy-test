// Constants
import { Schema, Model, leadStatus, leadSources } from "#constants";

// Utils
import { ATTRIBUTION_CHANNELS } from "#utils";

/**
 * Reklam mənbəyi — müraciət hansı kampaniyadan gəlib.
 *
 * Müraciətin ÖZ qeydində saxlanılır (sessiya hadisəsinə istinad kimi yox):
 * hadisələr təmizlənsə də, admin süzgəci və hesabat sadə qalsın. Ayrıca
 * `_id`-siz alt-sənəddir — müraciətlə birlikdə yaranır, ayrıca redaktə olunmur.
 * Təmizlənmə və kanalın təyini: utils/leadAttribution.js.
 */
const attributionSchema = new Schema(
  {
    // Google Ads / Organik / Birbaşa … — serverdə hesablanır, saytdan gəlmir.
    channel: { type: String, enum: ATTRIBUTION_CHANNELS },
    source: { type: String, trim: true, maxlength: 80 },     // utm_source
    medium: { type: String, trim: true, maxlength: 80 },     // utm_medium
    campaign: { type: String, trim: true, maxlength: 150 },  // utm_campaign — çox vaxt {campaignid}
    term: { type: String, trim: true, maxlength: 150 },      // utm_term — açar söz ({keyword})
    content: { type: String, trim: true, maxlength: 150 },   // utm_content — reklam qrupu ({adgroupid})
    gclid: { type: String, trim: true, maxlength: 200 },     // Google klik kodu — oflayn konversiya üçün
    landing: { type: String, trim: true, maxlength: 300 },   // reklamdan açılan ilk səhifə
    referrerHost: { type: String, trim: true, maxlength: 120 },
    capturedAt: { type: Date },                              // reklam klikinin vaxtı
  },
  { _id: false },
);

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

    // DİQQƏT: bu, reklam mənbəyi DEYİL — müraciətin HANSI FORMADAN gəldiyidir
    // («Müraciət et» modalı, əlaqə səhifəsi …). Reklam mənbəyi `attribution`-dadır.
    source: { type: String, enum: leadSources, default: "apply-modal" },
    // Page the form was submitted from, for attribution
    pageUrl: { type: String, trim: true, maxlength: 500 },

    attribution: { type: attributionSchema, default: undefined },

    status: { type: String, enum: leadStatus, default: "new" },
    note: { type: String, trim: true, maxlength: 3000 },
    handledBy: { type: Schema.Types.ObjectId, ref: "User" },
    handledAt: { type: Date },
    // «Qeydiyyatdan keçdi» statusuna keçdiyi an — Google Ads-ə offline
    // konversiya vaxtı kimi göndərilir. `handledAt` hər status dəyişikliyində
    // yenilənir, ona görə bu məqsədə yaramır. Aşağıdakı hook doldurur.
    enrolledAt: { type: Date },

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
// «Google Ads-dən gələn müraciətlər» süzgəci.
leadSchema.index({ "attribution.channel": 1, createdAt: -1 });

// Generic yeniləmə də, status endpointi də save() ilə gedir — hər iki yol buradan keçir.
leadSchema.pre("save", function () {
  if (!this.isModified("status")) return;
  if (this.status === "enrolled") {
    if (!this.enrolledAt) this.enrolledAt = new Date();
  } else {
    this.enrolledAt = undefined; // səhvən qeyd edilib geri alınıbsa
  }
});

leadSchema.methods.markHandled = async function (userId, status = "contacted") {
  this.status = status;
  this.handledBy = userId;
  this.handledAt = new Date();
  await this.save();
  return this;
};

export const Lead = Model("Lead", leadSchema);
