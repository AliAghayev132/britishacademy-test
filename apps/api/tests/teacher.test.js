import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Teacher, syncDerived } from "#models";

// Müəllim təyinatları: «hansı filialda hansı dərsi keçir».
// `branches` və `courses` bu təyinatlardan TÖRƏYİR — onlar mövcud filtrlər
// və indekslər üçün saxlanılır (məsələn «bu filialın müəllimləri»). Sinxron
// qalmasalar filtr səhv nəticə verər.

const oid = () => new mongoose.Types.ObjectId();

describe("syncDerived", () => {
  it("təyinatlardan filial və kurs siyahılarını qurur", () => {
    const b1 = oid(), b2 = oid(), c1 = oid(), c2 = oid();
    const doc = {
      assignments: [
        { branch: b1, courses: [c1, c2] },
        { branch: b2, courses: [c1] },
      ],
    };
    syncDerived(doc);
    expect(doc.branches).toHaveLength(2);
    // c1 iki filialda təkrarlanır — bir dəfə sayılmalıdır
    expect(doc.courses).toHaveLength(2);
  });

  it("kurssuz filialı da qeyd edir", () => {
    const b = oid();
    const doc = { assignments: [{ branch: b, courses: [] }] };
    syncDerived(doc);
    expect(doc.branches).toEqual([String(b)]);
    expect(doc.courses).toEqual([]);
  });

  it("boş/naməlum dəyərlərdə çökmür", () => {
    const doc = { assignments: [] };
    syncDerived(doc);
    expect(doc.branches).toBeUndefined(); // toxunulmur

    const doc2 = {};
    expect(() => syncDerived(doc2)).not.toThrow();

    const doc3 = { assignments: [{ branch: null, courses: [null, undefined] }] };
    syncDerived(doc3);
    expect(doc3.branches).toEqual([]);
    expect(doc3.courses).toEqual([]);
  });
});

describe("assignments sxemi", () => {
  it("dərs SAATI saxlamır", () => {
    // Qərar: müəllim səhifəsində vaxt cədvəli yoxdur — qrafik dəyişəndə iki
    // yerdə yeniləmə tələb edirdi. Kimsə weekday/from/to əlavə etsə bu test
    // xəbərdarlıq verəcək.
    const paths = Object.keys(Teacher.schema.path("assignments").schema.paths).sort();
    expect(paths).toEqual(["branch", "courses"]);
  });

  it("branch məcburidir", () => {
    const sub = Teacher.schema.path("assignments").schema;
    expect(sub.path("branch").isRequired).toBe(true);
  });

  it("təyinatsız müəllim etibarlıdır", () => {
    const t = new Teacher({ fullName: "Test" });
    expect(t.assignments).toEqual([]);
  });
});
