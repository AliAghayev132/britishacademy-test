import { describe, it, expect } from "vitest";
import { pickAz, field, thumbOf, isImagePath } from "@/lib/adminResources";

// REGRESSİYA QORUMASI — React #31.
// /admin/* endpointlərinə localizeResponse tətbiq olunmur, ona görə admin
// panelə xam {az,en,ru} obyekti gəlir. Onu birbaşa render etmək səhifəni
// tamamilə çökdürür. pickAz bu qorumadır.

describe("pickAz", () => {
  it("lokallaşdırılmış obyektdən AZ variantı seçir", () => {
    expect(pickAz({ az: "İngilis dili", en: "English", ru: "Английский" })).toBe("İngilis dili");
  });

  it("AZ boşdursa digər dilə düşür", () => {
    expect(pickAz({ az: "", en: "English", ru: "Английский" })).toBe("English");
    expect(pickAz({ az: "", en: "", ru: "Русский" })).toBe("Русский");
  });

  it("adi mətnə toxunmur", () => {
    expect(pickAz("Sərbəst mətn")).toBe("Sərbəst mətn");
  });

  it("null/undefined-i olduğu kimi qaytarır", () => {
    expect(pickAz(null)).toBeNull();
    expect(pickAz(undefined)).toBeUndefined();
  });

  it("massivi lokallaşdırılmış saymır", () => {
    expect(pickAz(["a", "b"])).toEqual(["a", "b"]);
  });

  it("nəticə HEÇ VAXT obyekt olmur", () => {
    // Əsas müqavilə: React uşaq elementi kimi render oluna bilməlidir.
    const inputs = [
      { az: "a", en: "b", ru: "c" },
      { az: "", en: "", ru: "" },
      "mətn",
      42,
      null,
      undefined,
    ];
    for (const v of inputs) {
      const out = pickAz(v);
      const isPlainObject = out !== null && typeof out === "object" && !Array.isArray(out);
      expect(isPlainObject).toBe(false);
    }
  });
});

describe("field", () => {
  it("sahə adı ilə işləyir və lokallaşdırılmışı açır", () => {
    expect(field({ title: { az: "Kurs", en: "Course" } }, "title")).toBe("Kurs");
  });

  it("funksiya spesifikasiyası ilə işləyir", () => {
    expect(field({ a: { az: "X" } }, (i) => i.a)).toBe("X");
  });

  it("çatışmayan sahədə boş qaytarır", () => {
    expect(field({}, "yoxdur")).toBe("");
  });
});

describe("thumbOf / isImagePath", () => {
  it("yayılmış şəkil sahələrini tapır", () => {
    expect(thumbOf({ url: "/uploads/a.png" })).toBe("/uploads/a.png");
    expect(thumbOf({ image: "/uploads/b.jpg" })).toBe("/uploads/b.jpg");
    expect(thumbOf({ photo: "/uploads/c.webp" })).toBe("/uploads/c.webp");
  });

  it("şəkli olmayanda null qaytarır", () => {
    expect(thumbOf({ name: "Filial" })).toBeNull();
    expect(thumbOf({ image: "   " })).toBeNull();
    expect(thumbOf(null)).toBeNull();
  });

  it("şəkil uzantısını tanıyır", () => {
    expect(isImagePath("/a/b.png")).toBe(true);
    expect(isImagePath("/a/b.mp4")).toBe(false);
    expect(isImagePath("/a/b.pdf")).toBe(false);
  });
});
