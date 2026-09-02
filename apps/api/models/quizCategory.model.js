// Constants
import { Schema, Model } from "#constants";
// Services
import { SlugService } from "#services";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";

/**
 * QuizCategory — testlərin qruplaşdırılması (İngilis dili, Rus dili …).
 *
 * NİYƏ AYRICA MODEL, sadə mətn sahəsi deyil: test sayı artdıqca siyahı
 * oxunmaz olur. Kateqoriya ilə həm test səhifəsi bölmələrə ayrılır, həm də
 * «Xidmətlər» menyusunda testlər kateqoriya üzrə göstərilə bilir. Üstəlik
 * `CourseCategory`/`BlogCategory` ilə eyni naxışdır — admin CRUD-u resurs
 * reyestrindən pulsuz gəlir.
 */
const quizCategorySchema = new Schema(
  {
    name: localizedField(),
    slug: { type: String, unique: true, index: true },
    // Test kartlarında və filtr çiplərində işlədilir.
    color: { type: String, trim: true, default: "#00157A" },
    icon: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true } },
);

quizCategorySchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.QuizCategory });

quizCategorySchema.pre("save", async function () {
  if (!this.slug) {
    this.slug = await SlugService.unique(this.constructor, this.name, this._id);
  }
});

quizCategorySchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
  });
};

export const QuizCategory = Model("QuizCategory", quizCategorySchema);
