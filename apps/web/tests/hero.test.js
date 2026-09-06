import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * Hero-nun üzən sözləri (chipsLeft / chipsRight).
 *
 * NASAZLIQ: sözlər mütləq mövqedədir və hero məzmunu mərkəzləşdirilib
 * (maxWidth 1000). Ekran daraldıqca mətn kənarlara yaxınlaşır və sözlər onun
 * üstünə düşür. Brauzerdə ölçüldü (başlıq hərflərinin həqiqi sərhədləri ilə):
 *
 *     900px → 2 söz,  768px → 3,  480px → 5,  390px → ALTISI da kəsişirdi
 *     1024px və yuxarı → kəsişmə yoxdur
 *
 * Ona görə 1024px-dən dar ekranda gizlədilir.
 */

const hero = fs.readFileSync("src/components/site/Hero.jsx", "utf8");
const css = fs.readFileSync("src/styles/globals.css", "utf8");

describe("hero üzən sözləri", () => {
  it("sarğı div-də `ba-hero-chip` sinfi var", () => {
    expect(hero).toMatch(/className="ba-hero-chip"/);
  });

  it("sinif SARĞIDADIR, çipin özündə deyil", () => {
    // Rəng çalarları `nth-of-type(4..9)` ilə seçilir — element sırası
    // pozulmamalıdır. Ona görə sinif sarğıdadır və gizlətmə `display:none`-dur
    // (elementi silmək sıranı sürüşdürərdi).
    expect(hero).toMatch(/className="ba-hero-chip" style=\{\{ position: "absolute"/);
  });

  it("dar ekranda gizlədilir", () => {
    const rule = /@media \(max-width:\s*(\d+)px\)\s*\{\s*\.ba-hero-chip\s*\{\s*display:\s*none/;
    expect(css).toMatch(rule);
    const px = Number(rule.exec(css)[1]);
    // Ölçmə 1024px-də təmiz, 900px-də 2 kəsişmə göstərdi.
    expect(px).toBeGreaterThanOrEqual(1000);
    expect(px).toBeLessThan(1200);
  });

  it("çalar seçiciləri toxunulmayıb", () => {
    // Gizlətmə bunları sındırmamalıdır.
    for (const n of [4, 5, 6, 7, 8, 9]) {
      expect(css).toContain(`.ba-hero > div:nth-of-type(${n}) [data-chip]`);
    }
  });
});
