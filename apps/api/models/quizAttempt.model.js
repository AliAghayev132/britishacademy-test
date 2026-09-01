// Constants
import { Schema, Model } from "#constants";

/**
 * QuizAttempt — testin bir dəfə həll edilməsi.
 *
 * ŞƏXSİ MƏLUMAT SAXLANILMIR. Test anonimdir: ad, telefon, e-poçt istənmir,
 * IP yazılmır. Bu qeydlər yalnız aqreqat sual üçündür — «testi neçə nəfər
 * həll etdi, orta bal nədir, hansı sual ən çox səhv cavablanır».
 *
 * Sual üzrə statistika (`wrongIds`) admin üçün faydalıdır: bir sual demək
 * olar hamı tərəfindən səhv cavablanırsa, çox güman sual və ya variantlar
 * səhv yazılıb.
 */
const quizAttemptSchema = new Schema(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    ts: { type: Date, default: Date.now },

    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    level: { type: String, trim: true },

    // Səhv cavablanan sualların id-ləri — sual keyfiyyəti hesabatı üçün.
    wrongIds: { type: [Schema.Types.ObjectId], default: [] },

    // Testin hansı dildə həll edildiyi (məzmun planlaması üçün).
    lang: { type: String, trim: true, default: "az" },
  },
  { versionKey: false },
);

quizAttemptSchema.index({ quiz: 1, ts: -1 });

export const QuizAttempt = Model("QuizAttempt", quizAttemptSchema);
