import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Hero düymələri və kurs kartlarının rəngi.
 *
 * İKİ DƏYİŞİKLİK:
 *  1. Düymələrin hamısı `#kurslar` lövbərinə bağlı idi — ünvanı dəyişmək
 *     üçün deploy lazım gəlirdi. İndi paneldən `hero.pillLinks` ilə verilir.
 *  2. Kurs kartlarının rəngi. Əvvəl səkkiz rəngli palitra vardı və kartlar
 *     TAM rəngli idi — bölmə rəngarəng görünüb brend rəngini itirirdi. Bir
 *     müddət tək brend mavisi işlədildi, sonra qərar dəqiqləşdi: kart AĞ
 *     qalır, rəng yalnız vurğudur (üst zolaq, kateqoriya yazısı, haşiyə,
 *     «Kursa bax»). Yəni «ağ ilə rəngli arasında».
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
  const palette = [...(cards.match(/const CARD_COLORS = \[[\s\S]*?\]/) || [""])[0]
    .matchAll(/"(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);

  it("palitra oxunur", () => {
    expect(palette.length, "CARD_COLORS tapılmadı — ad dəyişib?").toBeGreaterThanOrEqual(4);
    expect(palette).toContain("#00157A"); // brend rəngi palitrada qalır
  });

  it("hər rəng ağ fonda oxunaqlıdır (AA ≥ 4.5)", () => {
    // Kateqoriya yazısı MƏHZ bu rənglərlə yazılır. Yoxlama həm də «neon
    // rəng qoyulmasın» qoruyucusudur: parlaq ton ağ fonda AA-nı keçmir.
    const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    const lum = (h) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const weak = palette.filter((c) => (1.05 / (lum(c) + 0.05)) < 4.5);
    expect(weak, `ağ fonda zəif: ${weak.join(", ")}`).toEqual([]);
  });

  it("kart AĞ qalır — rəng yalnız vurğudur", () => {
    // İstək «ağ ilə rəngli arasında» idi. Fon rəngi ilə DOLDURULSAYDI kartlar
    // mavi lentin üstündə ağır görünərdi; ona görə çalar çox zəif alfa ilədir.
    const bg = cards.match(/background: `linear-gradient\(180deg, \$\{accent\}([0-9A-Fa-f]{2})/);
    expect(bg, "kart fonu tapılmadı").toBeTruthy();
    expect(parseInt(bg[1], 16), "fon çaları çox güclüdür").toBeLessThanOrEqual(0x1a); // ≤10%
    expect(cards).toMatch(/#fff \d+%\)`/); // qalan hissə ağdır
  });

  it("rəng kartın sırasından gəlir", () => {
    // Sıra verilməsə hash-ə düşür və yan-yana kartlar eyni rəngə düşə bilir —
    // ana səhifədəki altı kurs məhz belə üç soyuq tona yığılmışdı.
    expect(cards).toMatch(/CARD_COLORS\[index % CARD_COLORS\.length\]/);
  });

  it("HƏR siyahı sıranı ötürür", () => {
    const files = [
      "src/components/site/ServicesShowcase.jsx",
      "src/app/(public)/kurslar/page.js",
      "src/app/(public)/kurslar/[slug]/page.js",
    ];
    const bad = [];
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/<CourseCard\b[^/]*\/>/g)) {
        if (!/index=\{/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 60)}`);
      }
    }
    expect(bad, `sıra ötürülmür:\n${bad.join("\n")}`).toEqual([]);
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
