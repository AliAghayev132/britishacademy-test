import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * GOOGLE TAG MANAGER.
 *
 * NİYƏ «kod yerləşdirmə» sahəsindən İSTİFADƏ EDİLMƏDİ: paneldəki `head`
 * kodu brauzerdə, səhifə yükləndikdən SONRA əlavə olunur (CodeInjection.jsx).
 * GTM üçün bu iki səbəbdən yaramır —
 *   1. konteyner gec qalxır;
 *   2. `<noscript>` hissəsi belə üsulla HEÇ VAXT işləmir: o, məhz JavaScript
 *      sönülü olanlar üçündür, JavaScript ilə əlavə olunan noscript isə
 *      mənasızdır.
 * Ona görə hər ikisi server tərəfdə render olunur.
 *
 * YER: `(public)/layout.js` — kök layout DEYİL. Kök layout admin panelini və
 * girişi də əhatə edir; GTM konteyneri orada ixtiyari skript işlədib admin
 * tokenini (localStorage) oxuya bilərdi (audit #7).
 */

const gtm = fs.readFileSync("src/components/site/GoogleTagManager.jsx", "utf8");
const layout = fs.readFileSync("src/app/(public)/layout.js", "utf8");
const rootLayout = fs.readFileSync("src/app/layout.js", "utf8");

describe("GTM komponenti", () => {
  it("ID formatı yoxlanılır", () => {
    // ID sətir kimi skriptin İÇİNƏ yazılır — yoxlanmasa səhv dəyər skripti
    // sındırar və ya ixtiyari JS-ə çevrilər.
    expect(gtm).toMatch(/const VALID = \/\^GTM-/);
    expect(gtm).toMatch(/VALID\.test/);
  });

  it("ID boşdursa heç nə render olunmur", () => {
    // Test/dev mühitində təsadüfən statistika toplanmasın.
    const nulls = gtm.match(/if \(!gtm\) return null;/g) || [];
    expect(nulls.length, "hər iki komponentdə qapı olmalıdır").toBe(2);
  });

  it("hər iki hissə ixrac olunur", () => {
    expect(gtm).toMatch(/export function GtmScript/);
    expect(gtm).toMatch(/export function GtmNoScript/);
  });

  it("klient komponenti DEYİL", () => {
    // `"use client"` olsaydı yenə hidratasiyadan sonra işləyərdi — yəni
    // paneldəki üsulun eyni qüsuru qayıdardı.
    expect(gtm).not.toMatch(/^["']use client["']/m);
  });
});

describe("layout-dakı yerləşmə", () => {
  it("kök layout-da YOXDUR — admin panelində işləmir", () => {
    expect(rootLayout).not.toMatch(/<GtmScript|<GtmNoScript/);
  });

  it("noscript və skript səhifə məzmunundan ƏVVƏLDİR", () => {
    // Google-un tələbi: noscript body-nin əvvəlində.
    const content = layout.indexOf("<SiteProvider");
    const ns = layout.indexOf("<GtmNoScript");
    const script = layout.indexOf("<GtmScript");
    expect(ns).toBeGreaterThan(0);
    expect(script).toBeGreaterThan(0);
    expect(ns, "noscript məzmundan ƏVVƏL olmalıdır").toBeLessThan(content);
    expect(script, "skript məzmundan ƏVVƏL olmalıdır").toBeLessThan(content);
  });

  it("ID paneldən oxunur, koda yazılmır", () => {
    // Dəyişmək/söndürmək üçün deploy lazım gəlməsin.
    expect(layout).toMatch(/inject\.gtmId/);

    // Şərhlər çıxarılır: sənəd blokundakı `GTM-XXXXXXX` NÜMUNƏSİ real ID
    // deyil, amma xam mətndə axtarsaq yalançı uyğunluq verir.
    const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const [name, src] of [["(public)/layout.js", layout], ["GoogleTagManager.jsx", gtm]]) {
      expect(strip(src), `${name}: ID koda sabit yazılıb`).not.toMatch(/GTM-[A-Z0-9]{6,}/);
    }
  });
});
