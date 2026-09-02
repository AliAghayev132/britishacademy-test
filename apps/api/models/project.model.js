// Constants
import { Schema, Model } from "#constants";
// Services
import { SlugService } from "#services";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";
// Shared sub-schemas
import { seoSchema, contentBlockSchema, factSchema, faqItemSchema } from "./shared.schemas.js";

/**
 * Project — məktəbin layihələri (Xaricdə təhsil modulu ilə eyni quruluşda).
 *
 * NİYƏ AYRICA MODEL, kurs deyil:
 * Layihə satılan xidmət deyil — səviyyəsi, qiyməti, dərs qrafiki yoxdur.
 * Kurs modelinə sıxışdırmaq həmin sahələri boş saxlamağı və hər kurs
 * siyahısında layihələri süzməyi tələb edərdi.
 *
 * MÜRACİƏT YALNIZ LAYİHƏNİN ÖZ SƏHİFƏSİNDƏN edilir (müştəri tələbi), ona görə
 * ümumi müraciət formasında layihə seçimi YOXDUR — `Lead.project` sahəsi
 * yalnız həmin səhifədən doldurulur.
 */
const projectSchema = new Schema(
  {
    title: localizedField(),
    slug: { type: String, unique: true, index: true },

    // Kartda başlığın altında görünən qısa cümlə.
    tagline: localizedField(),
    lead: localizedField(),

    // Mətn blokları və ya rich-text — Destination ilə eyni yanaşma:
    // `contentHtml` doludursa o göstərilir, əks halda `content` blokları.
    content: { type: [contentBlockSchema], default: [] },
    contentHtml: localizedField(),
    facts: { type: [factSchema], default: [] },
    faq: { type: [faqItemSchema], default: [] },

    image: { type: String, trim: true },
    color: { type: String, trim: true, default: "#00157A" },

    // Müraciət düyməsi. Bəzi layihələr yalnız məlumat xarakterlidir —
    // onlarda düymə göstərilmir.
    applyEnabled: { type: Boolean, default: true },
    applyLabel: localizedField(),

    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false }, // ana səhifə lenti
    seo: { type: seoSchema, default: () => ({}) },
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

projectSchema.index({ isActive: 1, order: 1 });

projectSchema.virtual("url").get(function () {
  return `/layiheler/${this.slug}`;
});

projectSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Project });

projectSchema.pre("save", async function () {
  if (!this.slug) {
    this.slug = await SlugService.unique(this.constructor, this.title, this._id);
  }
});

projectSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({
    order: 1,
    createdAt: -1,
  });
};

export const Project = Model("Project", projectSchema);
