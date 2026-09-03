// ── Testlər (public) ──
// Sual siyahısının verilməsi və cavabların qiymətləndirilməsi.

// Utils
import { asyncHandler, parseLocale } from "#utils";
// Models
import { Quiz, QuizAttempt } from "#models";

/**
 * TƏHLÜKƏSİZLİK QAYDASI:
 * `correctIndex` və `explanation` testi verməzdən ƏVVƏL kəsilir. Onlar cavabda
 * getsəydi, istifadəçi səhifənin mənbə koduna baxıb bütün cavabları görərdi və
 * testin heç bir mənası qalmazdı.
 *
 * Qiymətləndirmə də serverdə aparılır — client yalnız seçdiyi variantın
 * id-sini göndərir.
 */

/** Massivi qarışdır (Fisher–Yates). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sualı public formaya gətir: düzgün cavab və izah çıxarılır.
 * Variantlar yalnız `_id` + mətn kimi qalır.
 */
function publicQuestion(q, shuffleOptions) {
  const options = (q.options || []).map((o) => ({ _id: o._id, text: o.text }));
  return {
    _id: q._id,
    text: q.text,
    options: shuffleOptions ? shuffle(options) : options,
  };
}

/**
 * Cavabları qiymətləndir — TƏMİZ funksiya (bazaya müraciət etmir).
 *
 * Ayrıca çıxarılıb ki, testlə örtülə bilsin: səhv hesablama istifadəçiyə
 * yanlış səviyyə göstərmək deməkdir və bunu gözlə görmək mümkün deyil.
 *
 * Variantlar qarışdırıla bildiyi üçün müqayisə İNDEKSƏ deyil, variantın
 * `_id`-sinə görə aparılır.
 *
 * @param {Array} questions  testin sualları (düzgün cavabla birlikdə)
 * @param {Array} answers    [{ questionId, optionId }]
 */
export function scoreAnswers(questions, answers) {
  const byId = new Map((questions || []).map((q) => [String(q._id), q]));

  let score = 0;
  const wrongIds = [];
  const results = [];
  // Eyni sual iki dəfə göndərilsə ikinci dəfə sayılmasın — əks halda
  // təkrar göndərişlə balı şişirtmək olardı.
  const seen = new Set();

  for (const a of answers || []) {
    const key = String(a?.questionId);
    const q = byId.get(key);
    // Naməlum sual id-si atılır (köhnə səhifə açıq qalıbsa baş verə bilər).
    if (!q || seen.has(key)) continue;
    seen.add(key);

    const correct = q.options?.[q.correctIndex];
    const isCorrect = Boolean(correct && String(correct._id) === String(a?.optionId));

    if (isCorrect) score += 1;
    else wrongIds.push(q._id);

    results.push({
      questionId: q._id,
      chosenOptionId: a?.optionId ?? null,
      correctOptionId: correct?._id ?? null,
      isCorrect,
      // İzah YALNIZ burada — cavab verildikdən sonra — açılır.
      explanation: q.explanation,
    });
  }

  return { score, wrongIds, results };
}

/**
 * GET /api/quizzes — aktiv testlərin siyahısı (sualsız).
 */
const listQuizzes = asyncHandler(async (_req, res) => {
  const items = await Quiz.findPublic()
    // `category` HƏM select-də, HƏM populate-də olmalıdır: select-dən düşsə
    // populate ediləcək sahə sənəddə olmur və nəticə həmişə null qalır.
    .select("title slug lead questions questionCount timeLimitMin order category")
    .populate("category", "name slug color order")
    .lean();

  res.json({
    success: true,
    data: {
      items: items.map((q) => ({
        _id: q._id,
        title: q.title,
        slug: q.slug,
        lead: q.lead,
        // Siyahıda yalnız sual SAYI göstərilir — sualların özü yox.
        questionCount: q.questionCount || (q.questions || []).filter((x) => x.isActive !== false).length,
        timeLimitMin: q.timeLimitMin || 0,
        // Kateqoriya siyahını bölmələrə ayırmaq üçündür; yoxdursa null.
        category: q.category
          ? {
              _id: q.category._id,
              name: q.category.name,
              slug: q.category.slug,
              color: q.category.color,
              order: q.category.order,
            }
          : null,
      })),
    },
  });
});

/**
 * GET /api/quizzes/:slug — testin sualları (düzgün cavablar olmadan).
 *
 * Sıra və alt çoxluq testin öz tənzimləməsindən asılıdır: `random` seçilibsə
 * hər açılışda başqa sıra gəlir ki, təkrar girən adam sıranı əzbərləməsin.
 */
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({
    slug: String(req.params.slug || "").toLowerCase(),
    isActive: true,
    isDeleted: false,
  });

  if (!quiz) {
    return res.status(404).json({ success: false, message: "Test tapılmadı" });
  }

  // Baxış sayğacı — statistika səhifəsi üçün. Cavabı gözlətməmək
  // məqsədilə `await` edilmir.
  Quiz.updateOne({ _id: quiz._id }, { $inc: { views: 1 } }).catch(() => {});

  let questions = (quiz.questions || []).filter((q) => q.isActive !== false);

  questions = quiz.questionOrder === "random"
    ? shuffle(questions)
    : [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));

  // `questionCount` sual bankından neçəsinin göstəriləcəyini müəyyən edir.
  // 0 və ya bankdan böyükdürsə hamısı verilir.
  const limit = quiz.questionCount > 0 ? Math.min(quiz.questionCount, questions.length) : questions.length;
  questions = questions.slice(0, limit);

  res.json({
    success: true,
    data: {
      _id: quiz._id,
      title: quiz.title,
      slug: quiz.slug,
      lead: quiz.lead,
      description: quiz.description,
      timeLimitMin: quiz.timeLimitMin || 0,
      total: questions.length,
      questions: questions.map((q) => publicQuestion(q, quiz.shuffleOptions)),
      seo: quiz.seo,
    },
  });
});

/**
 * POST /api/quizzes/:slug/submit
 * body: { answers: [{ questionId, optionId }] }
 *
 * Variantlar qarışdırıla bildiyi üçün İNDEKS deyil, variantın `_id`-si
 * göndərilir — qarışdırılmış sırada indeks heç nə ifadə etmir.
 */
const submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findOne({
    slug: String(req.params.slug || "").toLowerCase(),
    isActive: true,
    isDeleted: false,
  });

  if (!quiz) {
    return res.status(404).json({ success: false, message: "Test tapılmadı" });
  }

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  if (answers.length === 0) {
    return res.status(400).json({ success: false, message: "Cavab göndərilməyib" });
  }

  const { score, wrongIds, results } = scoreAnswers(quiz.questions, answers);

  const total = results.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const level = quiz.levelFor(percent);

  // Anonim qeyd — şəxsi məlumat yoxdur, yalnız aqreqat hesabat üçün.
  await QuizAttempt.create({
    quiz: quiz._id,
    score,
    total,
    percent,
    level: level?.label || "",
    wrongIds,
    lang: parseLocale(req.query.lang || req.headers["x-lang"]),
  });

  res.json({
    success: true,
    data: {
      score,
      total,
      percent,
      level: level
        ? { label: level.label, title: level.title, description: level.description }
        : null,
      results,
      cta: quiz.ctaHref ? { label: quiz.ctaLabel, href: quiz.ctaHref } : null,
    },
  });
});

export { listQuizzes, getQuiz, submitQuiz };
