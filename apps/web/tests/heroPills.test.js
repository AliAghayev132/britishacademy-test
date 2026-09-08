import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Hero düymələri və kurs kartlarının rəngi.
 *
 * İKİ DƏYİŞİKLİK:
 *  1. Düymələrin hamısı `#kurslar` lövbərinə bağlı idi — ünvanı dəyişmək
 *     üçün deploy lazım gəlirdi. İndi paneldən `hero.pillLinks` ilə verilir.
 *  2. Kurs kartlarının rəngi. Səkkiz rəngli doymuş palitradan tək brend
 *     mavisinə, oradan da indiki hala keçdi: kartların FONU pastel rənglidir,
 *     rəng həm də üst zolaqda, kateqoriya yazısında, haşiyədə və «Kursa bax»
 *     linkindədir. Testlərin işi rəngi qorumaq deyil — ÇALARIN mətni udmasının
 *     qarşısını almaqdır.
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

  /** WCAG nisbəti. */
  const ratio = (() => {
    const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = (h) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    return (a, b) => {
      const [x, y] = [lum(a), lum(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
  })();
  const tint = (hex, amount) =>
    `#${[1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16))
      .map((v) => Math.round(v * amount + 255 * (1 - amount)).toString(16).padStart(2, "0"))
      .join("")}`;

  // Fondakı ƏN TÜND çalar — kateqoriya yazısı məhz orada oturur.
  const topTint = Number(
    (cards.match(/background: `linear-gradient\(180deg, \$\{tint\(accent, ([\d.]+)\)/) || [])[1],
  );
  const bodyText = (cards.match(/fontSize: 14\.5, color: "(#[0-9A-Fa-f]{6})"/) || [])[1];

  it("fon rəngi qeyri-şəffafdır", () => {
    // Kart mavi lentin ÜSTÜNDƏDİR. Fon alfa ilə verilsəydi lentin mavisi
    // içəri sızardı və hər kart rəngindən asılı olmayaraq göyə çalardı.
    expect(topTint, "çalar dəyəri oxunmadı — fon ifadəsi dəyişib?").toBeGreaterThan(0);
    expect(cards).toMatch(/function tint\(hex, amount\)/);
    expect(cards).not.toMatch(/background: `linear-gradient\(180deg, \$\{accent\}[0-9A-Fa-f]{2}/);
  });

  it("rəngli fonun üstündə hər mətn AA (≥4.5) keçir", () => {
    // Kartlar «rəngli olsun» deyə pastel fon aldı. Çaları artırmaq asandır,
    // amma müəyyən həddən sonra kateqoriya yazısı öz fonunda itir — bu test
    // həmin həddi qoruyur və hansı rəngin sındığını adı ilə deyir.
    expect(bodyText, "mətn rəngi oxunmadı").toBeTruthy();
    const bad = [];
    for (const c of palette) {
      const bg = tint(c, topTint);
      if (ratio(c, bg) < 4.5) bad.push(`${c}: kateqoriya yazısı ${ratio(c, bg).toFixed(2)}`);
      if (ratio(bodyText, bg) < 4.5) bad.push(`${c}: mətn ${ratio(bodyText, bg).toFixed(2)}`);
      if (ratio("#17171F", bg) < 4.5) bad.push(`${c}: başlıq ${ratio("#17171F", bg).toFixed(2)}`);
    }
    expect(bad, `çalar ${(topTint * 100).toFixed(0)}%-də zəif:\n${bad.join("\n")}`).toEqual([]);
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
