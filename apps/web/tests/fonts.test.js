import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * ŞRİFTLƏR YERLİDİR (self-hosted).
 *
 * Əvvəl Poppins və Nunito Sans hər ziyarətçi üçün Google-dan çəkilirdi —
 * `fonts.googleapis.com`-dan CSS, sonra `fonts.gstatic.com`-dan fayllar,
 * cəmi 40-a yaxın kənar sorğu. Nəticədə:
 *   • Google saytın bütün ziyarətçilərini görürdü;
 *   • Google əlçatmaz olsa yazılar ehtiyat şriftlə görünürdü;
 *   • hər səhifə açılışında iki kənar hosta DNS + TLS gedirdi.
 *
 * İndi fayllar `public/fonts/`-dadır və `styles/fonts.css` onlara
 * `@font-face` verir.
 */

const cssPath = "src/styles/fonts.css";
const dir = "public/fonts";
const css = fs.readFileSync(cssPath, "utf8");
const files = fs.readdirSync(dir);

/** CSS-dəki bütün `@font-face` blokları. */
const faces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(([, body]) => ({
  family: (body.match(/font-family:\s*'([^']+)'/) || [])[1],
  weight: (body.match(/font-weight:\s*(\d+)/) || [])[1],
  file: (body.match(/url\('\/fonts\/([^']+)'\)/) || [])[1],
  range: (body.match(/unicode-range:\s*([^;]+);/) || [])[1],
  display: (body.match(/font-display:\s*(\w+)/) || [])[1],
}));

describe("kənar şrift asılılığı yoxdur", () => {
  it("mənbədə Google Fonts ünvanı qalmayıb", () => {
    const bad = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|css)$/.test(e.name)) {
          const src = fs.readFileSync(p, "utf8");
          // Şərhlərdə adı çəkmək olar — yalnız HƏQİQİ istinadları axtarırıq.
          if (/(href|url|src)\s*[=(:]\s*["']?https:\/\/fonts\.(googleapis|gstatic)\.com/.test(src)) {
            bad.push(p.replace(/\\/g, "/"));
          }
        }
      }
    };
    walk("src");
    expect(bad, `hələ Google-dan çəkilir:\n${bad.join("\n")}`).toEqual([]);
  });

  it("fonts.css globals.css-ə qoşulub", () => {
    expect(fs.readFileSync("src/styles/globals.css", "utf8")).toMatch(/@import "\.\/fonts\.css"/);
  });
});

describe("şrift faylları", () => {
  it("CSS-də üzlər var", () => {
    expect(faces.length, "@font-face tapılmadı").toBeGreaterThanOrEqual(20);
  });

  it("hər üzün faylı DİSKDƏ var", () => {
    // Yoxsa brauzer 404 alır və yazı ehtiyat şriftlə görünür — səssiz nasazlıq.
    const missing = faces.filter((f) => !files.includes(f.file)).map((f) => f.file);
    expect(missing, `fayl yoxdur: ${missing.join(", ")}`).toEqual([]);
  });

  it("artıq fayl qalmayıb", () => {
    // Şrift dəyişəndə köhnə fayllar repoda qalıb yer tutmasın.
    const used = new Set(faces.map((f) => f.file));
    const orphans = files.filter((f) => f.endsWith(".woff2") && !used.has(f));
    expect(orphans, `CSS-də istifadə olunmayan: ${orphans.join(", ")}`).toEqual([]);
  });

  it("hamısı woff2-dir", () => {
    // Bütün müasir brauzerlər dəstəkləyir və ən yığcamıdır.
    expect(files.filter((f) => !f.endsWith(".woff2"))).toEqual([]);
  });
});

describe("üzlərin düzgünlüyü", () => {
  it("hər üzdə `unicode-range` var", () => {
    // ONSUZ BRAUZER HAMISINI ENDİRİR: azərbaycanca səhifə kiril fayllarını da
    // çəkərdi — 420 KB-ın hamısı, lazım olan ~90 KB yerinə.
    const bad = faces.filter((f) => !f.range).map((f) => `${f.family} ${f.weight}`);
    expect(bad, `unicode-range yoxdur: ${bad.join(", ")}`).toEqual([]);
  });

  it("hər üzdə `font-display: swap` var", () => {
    // Şrift yüklənənə qədər mətn GÖRÜNMƏLİDİR.
    const bad = faces.filter((f) => f.display !== "swap").map((f) => `${f.family} ${f.weight}`);
    expect(bad, `swap yoxdur: ${bad.join(", ")}`).toEqual([]);
  });

  it("üç dilin də hərfləri örtülür", () => {
    // AZ latin-ext-dədir (ə U+0259), RU kirildə, EN latinda. Biri əskik olsa
    // həmin dildə mətn ehtiyat şriftə düşərdi.
    const has = (family, sub) => faces.some((f) => f.family === family && f.file.includes(sub));
    for (const sub of ["latin", "latin-ext", "cyrillic"]) {
      expect(has("Nunito Sans", sub), `Nunito Sans ${sub} yoxdur`).toBe(true);
    }
    // Poppins-in kirili YOXDUR (Google-da da yoxdur) — rus başlıqları
    // Nunito Sans-a düşür. Bu, əvvəlki davranışla eynidir.
    for (const sub of ["latin", "latin-ext"]) {
      expect(has("Poppins", sub), `Poppins ${sub} yoxdur`).toBe(true);
    }
  });

  it("işlədilən bütün çəkilər var", () => {
    const weights = (family) =>
      [...new Set(faces.filter((f) => f.family === family).map((f) => Number(f.weight)))].sort();
    expect(weights("Poppins")).toEqual([500, 600, 700, 800]);
    expect(weights("Nunito Sans")).toEqual([400, 500, 600, 700, 800]);
  });
});
