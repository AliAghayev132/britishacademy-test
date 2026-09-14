import { describe, it, expect } from "vitest";
import { courseTitleIndex, normTitle, rankLeadInterests } from "#utils";

const ielts = { _id: "c1", slug: "ielts-kurslari", title: { az: "IELTS kursları", en: "IELTS courses", ru: "Курсы IELTS" } };
const eng = { _id: "c2", slug: "ingilis-dili-kurslari", title: { az: "İngilis dili kursları", en: "English courses", ru: "" } };

describe("müraciət → kurs uyğunlaşdırması", () => {
  it("ad üç dildə, böyük/kiçik hərf və boşluqdan asılı olmadan tapılır", () => {
    const idx = courseTitleIndex([ielts, eng]);
    expect(idx.get(normTitle("  ielts   KURSLARI "))).toBe(ielts);
    expect(idx.get(normTitle("English courses"))).toBe(eng);
    expect(idx.get(normTitle("Курсы IELTS"))).toBe(ielts);
    expect(idx.get(normTitle(""))).toBeUndefined();
  });

  it("köhnə müraciətlər (course boş) maraq mətni ilə kursa birləşir", () => {
    const rows = rankLeadInterests(
      [
        { course: "c1", interest: "IELTS kursları", count: 2 },
        { course: null, interest: "IELTS courses", count: 3 }, // EN səhifədən, id yoxdur
        { course: null, interest: "İngilis dili", count: 4 }, // ümumi maraq
        { course: null, interest: "", count: 9 }, // mətn yoxdur — sayılmır
        { course: "silinmiş", interest: "Müəllim: Aynur", count: 1 },
      ],
      [ielts, eng],
    );
    expect(rows).toEqual([
      { title: "IELTS kursları", slug: "ielts-kurslari", kind: "course", count: 5 },
      { title: "İngilis dili", kind: "interest", count: 4 },
      { title: "Müəllim: Aynur", kind: "interest", count: 1 },
    ]);
  });

  it("ən çox 10 sətir, azalan sıra ilə", () => {
    const groups = Array.from({ length: 15 }, (_, i) => ({ interest: `Maraq ${i}`, count: i + 1 }));
    const rows = rankLeadInterests(groups, []);
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({ title: "Maraq 14", count: 15 });
  });
});
