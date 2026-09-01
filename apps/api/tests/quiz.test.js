import { describe, it, expect } from "vitest";
import { scoreAnswers } from "#controllers/quizController.js";
import { QUIZZES } from "../data/quizData.mjs";

/**
 * Test sisteminin iki kritik nöqtəsi:
 *
 *  1) SUAL BANKININ DOĞRULUĞU — `correctIndex` variant sayından böyükdürsə
 *     istifadəçiyə «düzgün cavab yoxdur» göstərilir, üstəlik heç kim tam bal
 *     yığa bilmir. Bunu gözlə tutmaq üçün 50 sualı əl ilə saymaq lazımdır.
 *
 *  2) QİYMƏTLƏNDİRMƏ — səhv hesablama adama yanlış səviyyə verir. Bu, testin
 *     yeganə məhsuludur; səhv olsa bütün səhifənin mənası itir.
 */

/** Sualı model formasına yaxınlaşdır — variantlara _id ver. */
const withIds = (questions) =>
  questions.map((q, qi) => ({
    _id: `q${qi}`,
    ...q,
    options: q.options.map((o, oi) => ({ _id: `q${qi}o${oi}`, ...o })),
  }));

describe("sual bankı", () => {
  it("slug-lar təkrarlanmır", () => {
    const slugs = QUIZZES.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("köhnə saytın test ünvanları əhatə olunub", () => {
    // legacyRoutes.js /english-test və /rus-dili-test-i bura yönləndirir.
    // Slug dəyişsə yönləndirmə 404-ə düşərdi.
    const slugs = QUIZZES.map((q) => q.slug);
    expect(slugs).toContain("english-test");
    expect(slugs).toContain("rus-dili-test");
  });

  it.each(QUIZZES.map((q) => [q.slug, q]))("«%s» — hər sual etibarlıdır", (_slug, quiz) => {
    expect(quiz.questions.length).toBeGreaterThan(0);

    quiz.questions.forEach((q, i) => {
      const where = `sual #${i + 1}`;

      expect(q.options.length, `${where}: ən az 2 variant olmalıdır`).toBeGreaterThanOrEqual(2);

      // ƏSAS YOXLAMA: düzgün cavab mövcud variantı göstərməlidir.
      expect(q.correctIndex, `${where}: correctIndex diapazondan kənardır`).toBeLessThan(q.options.length);
      expect(q.correctIndex, `${where}: correctIndex mənfi ola bilməz`).toBeGreaterThanOrEqual(0);

      // Eyni variant iki dəfə yazılıbsa doğru cavab qeyri-müəyyən olur.
      const texts = q.options.map((o) => o.text.az.trim().toLowerCase());
      expect(new Set(texts).size, `${where}: variantlar təkrarlanır`).toBe(texts.length);

      expect(q.text.az.trim().length, `${where}: sual mətni boşdur`).toBeGreaterThan(0);
      texts.forEach((t, oi) => {
        expect(t.length, `${where}: variant #${oi + 1} boşdur`).toBeGreaterThan(0);
      });
    });
  });

  it.each(QUIZZES.map((q) => [q.slug, q]))("«%s» — səviyyə şkalası bütöv­dür", (_slug, quiz) => {
    expect(quiz.levels.length).toBeGreaterThan(0);
    // 0%-dən başlayan səviyyə olmalıdır, yoxsa çox aşağı bal üçün nəticə çıxmır.
    expect(Math.min(...quiz.levels.map((l) => l.minPercent))).toBe(0);
    // Eyni hədd iki dəfə verilsə hansının seçiləcəyi təsadüfi olar.
    const mins = quiz.levels.map((l) => l.minPercent);
    expect(new Set(mins).size).toBe(mins.length);
  });

  it("hər testin CTA hədəfi mövcud kurs slug-una işarə edir", () => {
    // Kurs slug-ları dəyişdirildi (ielts → ielts-kurslari); CTA köhnə qalsaydı
    // nəticə səhifəsindəki düymə 404-ə aparardı.
    const targets = QUIZZES.map((q) => q.ctaHref).filter(Boolean);
    for (const t of targets) {
      expect(t.startsWith("/kurslar/"), `${t} kurs ünvanı deyil`).toBe(true);
      expect(t).not.toMatch(/\/kurslar\/(ielts|sat|ingilis-dili-kursu)$/);
    }
  });
});

describe("qiymətləndirmə", () => {
  const questions = withIds([
    { text: { az: "1" }, options: [{ text: { az: "a" } }, { text: { az: "b" } }], correctIndex: 0 },
    { text: { az: "2" }, options: [{ text: { az: "a" } }, { text: { az: "b" } }], correctIndex: 1 },
    { text: { az: "3" }, options: [{ text: { az: "a" } }, { text: { az: "b" } }], correctIndex: 1 },
  ]);

  it("hamısı düzgün olanda tam bal verir", () => {
    const { score, results } = scoreAnswers(questions, [
      { questionId: "q0", optionId: "q0o0" },
      { questionId: "q1", optionId: "q1o1" },
      { questionId: "q2", optionId: "q2o1" },
    ]);
    expect(score).toBe(3);
    expect(results.every((r) => r.isCorrect)).toBe(true);
  });

  it("səhv cavabı sayır və id-sini qeyd edir", () => {
    const { score, wrongIds } = scoreAnswers(questions, [
      { questionId: "q0", optionId: "q0o1" }, // səhv
      { questionId: "q1", optionId: "q1o1" }, // düz
    ]);
    expect(score).toBe(1);
    expect(wrongIds).toEqual(["q0"]);
  });

  it("düzgün variantın id-si nəticədə qaytarılır", () => {
    // İstifadəçi harada səhv etdiyini görsün deyə.
    const { results } = scoreAnswers(questions, [{ questionId: "q1", optionId: "q1o0" }]);
    expect(results[0].correctOptionId).toBe("q1o1");
    expect(results[0].chosenOptionId).toBe("q1o0");
    expect(results[0].isCorrect).toBe(false);
  });

  it("naməlum sual id-si nəticəyə düşmür", () => {
    const { score, results } = scoreAnswers(questions, [
      { questionId: "yoxdur", optionId: "x" },
      { questionId: "q0", optionId: "q0o0" },
    ]);
    expect(score).toBe(1);
    expect(results).toHaveLength(1);
  });

  it("eyni sual təkrar göndərilsə bir dəfə sayılır", () => {
    // Əks halda eyni düzgün cavabı 50 dəfə göndərib bal şişirtmək olardı.
    const { score, results } = scoreAnswers(questions, [
      { questionId: "q0", optionId: "q0o0" },
      { questionId: "q0", optionId: "q0o0" },
      { questionId: "q0", optionId: "q0o0" },
    ]);
    expect(score).toBe(1);
    expect(results).toHaveLength(1);
  });

  it("cavabsız və pozuq giriş çökmür", () => {
    expect(() => scoreAnswers(questions, [])).not.toThrow();
    expect(() => scoreAnswers(questions, [null, undefined, {}])).not.toThrow();
    expect(() => scoreAnswers(null, null)).not.toThrow();
    expect(scoreAnswers(questions, []).score).toBe(0);
  });

  it("boş optionId səhv sayılır, düzgün yox", () => {
    const { score } = scoreAnswers(questions, [{ questionId: "q0" }]);
    expect(score).toBe(0);
  });
});
