import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * KURS FORMASINDA «QISA MƏLUMAT» KARTI VƏ FAQ.
 *
 * Hər ikisi modeldə var və kurs səhifəsində görünür (məs. «Müəllim: IELTS 8.0 ·
 * 10 il təcrübə»), amma formada sahəsi yox idi — paneldən dəyişmək mümkün
 * deyildi.
 */

const wizard = fs.readFileSync("src/app/(protected)/dashboard/_forms/CourseWizard.jsx", "utf8");

describe("kurs forması", () => {
  it("info və faq redaktə olunur və göndərilir", () => {
    expect(wizard).toContain("Qısa məlumat kartı");
    expect(wizard).toContain("Tez-tez verilən suallar");
    expect(wizard).toMatch(/info: info\.filter\(/);
    expect(wizard).toMatch(/faq: faq\.filter\(/);
  });

  it("mövcud məlumat 3 dildə formaya yüklənir (EN/RU itməsin)", () => {
    expect(wizard).toContain("setInfo((c.info || []).map((r) => ({ label: toLoc(r.label), value: toLoc(r.value) })));");
    expect(wizard).toContain("setFaq((c.faq || []).map((r) => ({ question: toLoc(r.question), answer: toLoc(r.answer) })));");
  });

  it("yalnız TAM boş sətir atılır — hər hansı dildə mətn varsa qalır", () => {
    expect(wizard).toContain("const hasText = (v) => Object.values(toLoc(v)).some((x) => String(x || \"\").trim());");
    expect(wizard).toContain("faq.filter((r) => hasText(r.question) || hasText(r.answer))");
  });

  it("kurs yüklənənə qədər saxlamaq olmur (boş siyahı mövcudun üstünə yazılmasın)", () => {
    expect(wizard).toContain("const saving = creating || updating || (editingId && loadingFull);");
  });
});
