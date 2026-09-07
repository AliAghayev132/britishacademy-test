import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Hero düymələri və kurs kartlarının rəngi.
 *
 * İKİ DƏYİŞİKLİK:
 *  1. Düymələrin hamısı `#kurslar` lövbərinə bağlı idi — ünvanı dəyişmək
 *     üçün deploy lazım gəlirdi. İndi paneldən `hero.pillLinks` ilə verilir.
 *  2. Kurs kartları səkkiz rəngli palitradan növbə ilə rəng alırdı və bölmə
 *     rəngarəng görünürdü. İndi tək brend mavisidir.
 */

const hero = fs.readFileSync("src/components/site/Hero.jsx", "utf8");
const cards = fs.readFileSync("src/components/site/cards.jsx", "utf8");

describe("hero düymələri", () => {
  it("paneldən gələn linkləri oxuyur", () => {
    expect(hero).toMatch(/hero\?\.pillLinks/);
  });

  it("daxili yollar üçün LocaleLink işlədilir", () => {
    // Əks halda /en və /ru-da kanonik AZ slug-a gedərdi.
    expect(hero).toMatch(/import \{ LocaleLink \} from/);
    expect(hero).toMatch(/to\.startsWith\("\/"\)/);
  });

  it("xarici link yeni pəncərədə açılır", () => {
    expect(hero).toMatch(/target: "_blank", rel: "noopener noreferrer"/);
  });

  it("link boş qalanda köhnə davranış qorunur", () => {
    // Geriyə uyğunluq: ünvan verilməyibsə kurslar bölməsinə sürüşdürür.
    expect(hero).toMatch(/if \(!to\) return <a href="#kurslar"/);
    // `pillLinks` boşdursa köhnə mətn siyahısı işlənir.
    expect(hero).toMatch(/linked\.length\s*\n?\s*\?/);
  });
});

describe("kurs kartlarının rəngi", () => {
  it("rəngarəng palitra qalmayıb", () => {
    expect(cards).not.toMatch(/CAT_COLORS/);
    // Palitradakı rənglər birbaşa da qalmamalıdır.
    for (const c of ["#F5A524", "#7C4DFF", "#E0533D", "#FF3D8B", "#22B07D"]) {
      expect(cards, `${c} hələ işlədilir`).not.toContain(c);
    }
  });

  it("brend mavisi işlədilir", () => {
    expect(cards).toMatch(/const ACCENT = "#00157A"/);
    expect(cards).toMatch(/"--accent": ACCENT/);
  });

  it("sıraya görə rəng seçimi yoxdur", () => {
    // `index % …` naxışı rəngi növbələşdirirdi.
    expect(cards).not.toMatch(/index % /);
  });
});

describe("düymələrin sırası", () => {
  const admin = fs.readFileSync("src/app/(protected)/dashboard/ana-sehife/page.js", "utf8");

  it("paneldə sıra dəyişdirmə var", () => {
    // Sıra saytda görünən ardıcıllıqdır. Onsuz ən çox satılan kursu əvvələ
    // çəkmək üçün düyməni silib yenidən yazmaq lazım gəlirdi.
    expect(admin).toMatch(/const movePill = \(index, dir\)/);
    expect(admin).toMatch(/movePill\(i, -1\)/);
    expect(admin).toMatch(/movePill\(i, 1\)/);
  });

  it("sərhəddəki oxlar söndürülür", () => {
    // Birinci sətirdə «yuxarı», sonuncuda «aşağı» işləməməlidir.
    expect(admin).toMatch(/disabled=\{i === 0\}/);
    expect(admin).toMatch(/disabled=\{i === \(form\.hero\.pillLinks \|\| \[\]\)\.length - 1\}/);
  });

  it("sayt massiv sırasını olduğu kimi göstərir", () => {
    // Hero-da çeşidləmə OLMAMALIDIR — əks halda paneldəki sıra saytda
    // görünməzdi və dəyişdirmənin mənası qalmazdı.
    expect(hero).toMatch(/linked\.map\(/);
    expect(hero).not.toMatch(/linked\.(sort|reverse)\(/);
  });
});
