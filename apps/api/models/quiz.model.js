// Constants
import { Schema, Model } from "#constants";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";
// Shared
import { seoSchema } from "./shared.schemas.js";

/**
 * Quiz — saytdakı qapalı (variantlı) test.
 *
 * Köhnə statik saytda /english-test və /rus-dili-test ən çox girilən iki
 * səhifə idi (birlikdə ayda 2000+ giriş). Orada test statik idi və nəticə
 * heç yerdə saxlanılmırdı; burada suallar admin paneldən idarə olunur.
 *
 * SUALLAR SƏNƏDİN İÇİNDƏ SAXLANILIR (ayrıca kolleksiya deyil):
 * bir test 20–40 sualdır, hamısı birlikdə redaktə olunur və birlikdə
 * göstərilir. Ayrıca kolleksiya hər açılışda əlavə sorğu və redaktədə
 * sinxronlaşma problemi demək olardı.
 *
 * DÜZGÜN CAVAB PUBLIC CAVABDA GETMİR — publicController onu kəsir və
 * qiymətləndirmə serverdə aparılır. Əks halda testin heç bir mənası qalmazdı:
 * cavablar səhifənin mənbə kodunda görünərdi.
 */

/** Bir sualın bir variantı. */
const optionSchema = new Schema(
  { text: localizedField() },
  { _id: true },
);

const questionSchema = new Schema(
  {
    text: localizedField(),
    options: { type: [optionSchema], default: [] },
    // Düzgün variantın `options` massivindəki indeksi.
    correctIndex: { type: Number, default: 0, min: 0 },
    // Nəticə səhifəsində «niyə belədir» izahı (istəyə bağlı).
    explanation: localizedField(),
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

/**
 * Bal aralığına görə nəticə etiketi.
 * `minPercent` azalan sırada yoxlanılır — ilk uyğun gələn götürülür.
 */
const levelSchema = new Schema(
  {
    minPercent: { type: Number, default: 0, min: 0, max: 100 },
    label: { type: String, trim: true }, // A1, B2, «Başlanğıc» …
    title: localizedField(),
    description: localizedField(),
  },
  { _id: false },
);

const quizSchema = new Schema(
  {
    title: localizedField(),
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9][a-z0-9-]*$/,
    },
    // Testin kateqoriyası (İngilis dili, Rus dili …). Boş ola bilər —
    // kateqoriyasız testlər siyahıda «Digər» altında toplanır.
    category: { type: Schema.Types.ObjectId, ref: "QuizCategory", default: null },
    lead: localizedField(),
    description: localizedField(),

    questions: { type: [questionSchema], default: [] },
    levels: { type: [levelSchema], default: [] },

    // «random» — hər açılışda suallar qarışdırılır (eyni adam təkrar girəndə
    // eyni sıranı əzbərləməsin). «sequential» — `order` üzrə sabit sıra.
    questionOrder: { type: String, enum: ["sequential", "random"], default: "sequential" },
    // Neçə sual göstərilsin. 0 = hamısı. Sual bankı böyükdürsə alt çoxluq seçilir.
    questionCount: { type: Number, default: 0, min: 0 },
    // Variantların sırası da qarışdırılsın (düzgün cavab həmişə eyni yerdə olmasın).
    shuffleOptions: { type: Boolean, default: false },
    // Dəqiqə ilə vaxt limiti. 0 = limitsiz.
    timeLimitMin: { type: Number, default: 0, min: 0 },

    // Nəticə səhifəsində göstərilən çağırış (kursa keçid və s.).
    ctaLabel: localizedField(),
    ctaHref: { type: String, trim: true, default: "" },

    seo: { type: seoSchema, default: () => ({}) },

    views: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

quizSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Quiz });

quizSchema.statics.findPublic = function (filter = {}) {
  return this.find({ ...filter, isActive: true, isDeleted: false }).sort({ order: 1 });
};

/**
 * Bal faizinə görə səviyyə.
 * Səviyyə siyahısı boşdursa null qaytarır — nəticə yalnız bal kimi göstərilir.
 */
quizSchema.methods.levelFor = function (percent) {
  const sorted = [...(this.levels || [])].sort((a, b) => b.minPercent - a.minPercent);
  return sorted.find((l) => percent >= l.minPercent) || null;
};

export const Quiz = Model("Quiz", quizSchema);
