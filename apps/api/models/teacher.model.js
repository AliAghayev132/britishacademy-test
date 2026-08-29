// Constants
import { Schema, Model } from "#constants";
// Services
import { SlugService } from "#services";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS, pickLocale } from "#utils";
// Local schemas
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
    title: localizedField(),
    image: { type: String, trim: true },
    year: { type: Number },
  },
  { _id: false },
);

/**
 * Bir filialda müəllimin apardığı dərslər.
 *
 * Dərs SAATI qəsdən yoxdur — müəllim səhifəsində vaxt cədvəli saxlamaq
 * lazımsız baxım yükü yaradırdı (qrafik dəyişəndə iki yerdə yenilənməli
 * olurdu). Burada yalnız «hansı filialda hansı dərsi keçir» qeyd olunur.
 * Vaxtlı qrafik lazım olarsa CourseGroup resursu yerindədir.
 */
const assignmentSchema = new Schema(
  {
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
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

    // Filial üzrə dərs təyinatları — əsas mənbə budur.
    assignments: { type: [assignmentSchema], default: [] },

    // `branches` və `courses` assignments-dən TÖRƏYİR (pre-save hook).
    // Onlar saxlanılır ki, mövcud indekslər və filtrlər (məsələn «bu filialın
    // müəllimləri») join etmədən işləməyə davam etsin.
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
  return (pickLocale(this.fullName) || "?").trim().charAt(0).toUpperCase();
});

teacherSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Teacher });

/**
 * assignments → branches/courses (təkrarsız).
 *
 * İxrac olunur ki, həm save, həm findOneAndUpdate yolu eyni funksiyanı
 * işlətsin və test onu birbaşa yoxlaya bilsin.
 */
export function syncDerived(doc) {
  if (!Array.isArray(doc.assignments) || doc.assignments.length === 0) return;
  const b = new Set();
  const c = new Set();
  for (const a of doc.assignments) {
    if (a?.branch) b.add(String(a.branch));
    for (const id of a?.courses || []) if (id) c.add(String(id));
  }
  doc.branches = [...b];
  doc.courses = [...c];
}

teacherSchema.pre("save", async function () {
  syncDerived(this);

  if (!this.slug) {
    this.slug = await SlugService.unique(
      this.constructor,
      this.fullName,
      this._id,
    );
  }

});

// Admin paneli findOneAndUpdate işlədir — orada da törəmə sahələr yenilənməlidir,
// əks halda filial filtri köhnə dəyərlə qalar.
teacherSchema.pre("findOneAndUpdate", function () {
  const u = this.getUpdate() || {};
  const set = u.$set || u;
  if (!Array.isArray(set.assignments)) return;
  syncDerived(set);
  this.setUpdate(u.$set ? { ...u, $set: set } : set);
});

teacherSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    fullName: 1,
  });
};

export const Teacher = Model("Teacher", teacherSchema);
