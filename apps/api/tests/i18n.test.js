import { describe, it, expect } from "vitest";
import {
  deepLocalize,
  pickLocale,
  parseLocale,
  normalizeLocalized,
  looksLocalized,
} from "#utils";

// Bu testlər konkret bir baq sinfini qoruyur: lokallaşdırılmış `{az,en,ru}`
// obyektlərinin düzgün açılmaması. Həmin baq istehsalatda React #31 kimi
// çıxırdı — obyekt uşaq element kimi render olunanda səhifə tamamilə çökür.

describe("parseLocale", () => {
  it("dəstəklənən dilləri qəbul edir", () => {
    expect(parseLocale("az")).toBe("az");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("ru")).toBe("ru");
  });

  it("naməlum dəyəri AZ-a düşürür", () => {
    // Bu, real hadisədir: "template" dəyəri dil kimi göndərilmişdi.
    expect(parseLocale("template")).toBe("az");
    expect(parseLocale("")).toBe("az");
    expect(parseLocale(undefined)).toBe("az");
    expect(parseLocale(null)).toBe("az");
  });
});

describe("looksLocalized", () => {
  it("lokallaşdırılmış obyekti tanıyır", () => {
    expect(looksLocalized({ az: "a", en: "b", ru: "c" })).toBe(true);
    expect(looksLocalized({ az: "a" })).toBe(true);
  });

  it("adi dəyərləri lokallaşdırılmış saymır", () => {
    expect(looksLocalized("mətn")).toBe(false);
    expect(looksLocalized(null)).toBe(false);
    expect(looksLocalized(["az", "en"])).toBe(false);
    expect(looksLocalized({ name: "x" })).toBe(false);
  });
});

describe("pickLocale", () => {
  it("istənilən dili qaytarır", () => {
    const v = { az: "Salam", en: "Hello", ru: "Привет" };
    expect(pickLocale(v, "en")).toBe("Hello");
    expect(pickLocale(v, "ru")).toBe("Привет");
  });

  it("boş dil üçün AZ-a düşür", () => {
    expect(pickLocale({ az: "Salam", en: "", ru: "" }, "en")).toBe("Salam");
  });

  it("lokallaşdırılmamış dəyəri toxunmadan qaytarır", () => {
    expect(pickLocale("düz mətn", "en")).toBe("düz mətn");
    expect(pickLocale(42, "en")).toBe(42);
  });
});

describe("deepLocalize", () => {
  it("dərin iç-içə obyektləri açır", () => {
    const doc = {
      title: { az: "Kurs", en: "Course", ru: "Курс" },
      branch: { name: { az: "Mərkəz", en: "Center", ru: "Центр" } },
      faq: [{ question: { az: "Sual", en: "Question", ru: "Вопрос" } }],
    };
    const out = deepLocalize(doc, "en");
    expect(out.title).toBe("Course");
    expect(out.branch.name).toBe("Center");
    expect(out.faq[0].question).toBe("Question");
  });

  it("cavabda heç bir {az,en,ru} obyekti qalmır", () => {
    // Əsas qoruma: nəticədə lokallaşdırılmış obyekt qalarsa, klient onu
    // render etməyə çalışacaq və çökəcək.
    const doc = {
      a: { az: "1", en: "2", ru: "3" },
      b: [{ c: { az: "x", en: "y", ru: "z" } }],
      d: { e: { f: { az: "p", en: "q", ru: "r" } } },
    };
    const out = deepLocalize(doc, "ru");
    const leftover = [];
    (function walk(v, path = "") {
      if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
      if (v && typeof v === "object") {
        if (looksLocalized(v)) leftover.push(path);
        Object.entries(v).forEach(([k, x]) => walk(x, path ? `${path}.${k}` : k));
      }
    })(out);
    expect(leftover).toEqual([]);
  });

  it("Date və primitivləri korlamır", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const out = deepLocalize({ when: d, n: 5, ok: true, nil: null }, "az");
    expect(out.n).toBe(5);
    expect(out.ok).toBe(true);
    expect(out.nil).toBeNull();
    expect(String(out.when)).toContain("2026");
  });

  it("boş massiv və obyektləri saxlayır", () => {
    const out = deepLocalize({ list: [], obj: {} }, "az");
    expect(out.list).toEqual([]);
    expect(out.obj).toEqual({});
  });
});

describe("normalizeLocalized", () => {
  it("adi mətni üç dilə yayır", () => {
    const out = normalizeLocalized("Salam");
    expect(out.az).toBe("Salam");
  });

  it("mövcud obyekti saxlayır", () => {
    const out = normalizeLocalized({ az: "a", en: "b", ru: "c" });
    expect(out).toMatchObject({ az: "a", en: "b", ru: "c" });
  });
});
