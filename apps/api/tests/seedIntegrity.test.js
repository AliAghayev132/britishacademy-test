import { describe, it, expect } from "vitest";
import { buildGraph, validateGraph } from "#services";

/**
 * Seed qrafikinin bütövlüyü — bazaya QOŞULMADAN.
 *
 * KONKRET NASAZLIQ: filial adları üçdilli edildikdə ({az,en,ru}) slug hələ də
 * `SlugService.slugify(b.name)` ilə qurulurdu. Obyekt sətrə çevriləndə
 * «object-object» alınırdı və DÖRD filialın hamısı eyni slug-u götürürdü.
 *
 * Səhv yalnız MongoDB `insertMany` mərhələsində üzə çıxırdı: istifadəçi
 * «Bütün datanı sil və yenidən yüklə» düyməsini basanda mənasız
 * «409 Conflict» alırdı — hansı model, hansı sahə, hansı dəyər bilinmirdi.
 * Üstəlik silmə artıq baş vermiş olurdu.
 *
 * validateSync bunu tuta bilmir: o, YALNIZ bir sənədə baxır, sənədlər arası
 * təkrarı görmür.
 */
describe("seed qrafiki", () => {
  const graph = buildGraph();

  it("validasiyadan keçir (unikallıq daxil)", () => {
    const { ok, errors } = validateGraph(graph);
    expect(ok, errors.map((e) => `${e.key}.${e.path}: ${e.message}`).join("\n")).toBe(true);
  });

  it("filial slugları fərqlidir və obyektdən yaranmayıb", () => {
    const slugs = graph.branches.map((b) => b.slug);
    expect(slugs).toHaveLength(4);
    // «object-object» — obyektin sətrə çevrilməsinin izi.
    for (const s of slugs) expect(s).not.toContain("object");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("slug daşıyan hər kolleksiyada təkrar yoxdur", () => {
    for (const key of ["branches", "categories", "teachers", "courses", "destinations", "pages", "quizzes"]) {
      const docs = graph[key] || [];
      const slugs = docs.map((d) => d.slug).filter(Boolean);
      const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
      expect(dupes, `${key}: təkrarlanan slug`).toEqual([]);
    }
  });

  it("slug boş və ya undefined deyil", () => {
    for (const key of ["branches", "courses", "teachers", "destinations", "pages", "quizzes"]) {
      for (const d of graph[key] || []) {
        expect(String(d.slug || "").trim(), `${key}: boş slug`).not.toBe("");
      }
    }
  });
});
