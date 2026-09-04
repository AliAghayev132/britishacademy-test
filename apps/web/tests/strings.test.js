import { describe, it, expect } from "vitest";
import { STRINGS } from "@/lib/i18n/strings";

/**
 * UI lüğətinin bütövlüyü.
 *
 * NİYƏ LAZIMDIR: açar bir dildə olub o birində olmayanda heç bir xəta çıxmır —
 * `t()` sakitcə AZ variantına düşür. Nəticədə /en və /ru saytında bir-iki
 * söz azərbaycanca qalır və bunu yalnız təsadüfən görmək olur.
 *
 * KONKRET HAL: «Onlayn Testlər» və «Bütün kurslar» aylarla EN/RU səhifələrdə
 * azərbaycanca göründü, çünki onlar ümumiyyətlə lüğətə salınmamışdı.
 */

const LOCALES = ["az", "en", "ru"];

describe("UI lüğəti", () => {
  it("hər üç dil mövcuddur", () => {
    for (const l of LOCALES) expect(STRINGS[l], l).toBeTypeOf("object");
  });

  it("açar dəstləri eynidir", () => {
    const az = Object.keys(STRINGS.az).sort();
    for (const l of ["en", "ru"]) {
      const keys = Object.keys(STRINGS[l]).sort();
      // Fərqi ADLARI ilə göstər — «uzunluqlar fərqlidir» heç nə demir.
      expect(az.filter((k) => !keys.includes(k)), `${l} dilində çatışmır`).toEqual([]);
      expect(keys.filter((k) => !az.includes(k)), `${l} dilində artıqdır`).toEqual([]);
    }
  });

  it("heç bir dəyər boş deyil", () => {
    for (const l of LOCALES) {
      const empty = Object.entries(STRINGS[l])
        .filter(([, v]) => typeof v !== "string" || !v.trim())
        .map(([k]) => k);
      expect(empty, `${l} dilində boş dəyər`).toEqual([]);
    }
  });

  it("EN və RU dəyərlərində azərbaycanca hərf qalmayıb", () => {
    // ə, ğ, ı — yalnız Azərbaycan əlifbasındadır. EN/RU mətnində görünürsə,
    // demək ki, sətir tərcümə edilməyib, sadəcə köçürülüb.
    const AZ_ONLY = /[əğıƏĞ]/;
    for (const l of ["en", "ru"]) {
      const left = Object.entries(STRINGS[l])
        .filter(([, v]) => AZ_ONLY.test(v))
        .map(([k, v]) => `${k}: ${v}`);
      expect(left, `${l} dilində tərcümə olunmamış sətir`).toEqual([]);
    }
  });

  it("RU dəyərləri kiril əlifbasındadır", () => {
    // Brend adları (British Academy, IELTS) latın qalır — ona görə şərt
    // «heç bir kiril hərfi yoxdur» halına qarşıdır, hər sətir üçün deyil.
    const latinOnly = Object.entries(STRINGS.ru)
      .filter(([, v]) => /[a-z]/i.test(v) && !/[а-яё]/i.test(v))
      .map(([k, v]) => `${k}: ${v}`);
    // Bu siyahı tamamilə boş ola bilməz (məs. "IELTS"), amma böyüməməlidir.
    expect(latinOnly.length, `kirilsiz RU sətirləri:\n${latinOnly.join("\n")}`).toBeLessThan(30);
  });
});
