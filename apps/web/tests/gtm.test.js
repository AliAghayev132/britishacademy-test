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
 * Ona görə hər ikisi server tərəfdə, `layout.js`-in içində render olunur.
 */

const gtm = fs.readFileSync("src/components/site/GoogleTagManager.jsx", "utf8");
const layout = fs.readFileSync("src/app/layout.js", "utf8");

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
  it("skript `<head>` içindədir", () => {
    const head = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));
    expect(head).toContain("<GtmScript");
  });

  it("noscript `<body>`-nin ƏVVƏLİNDƏDİR", () => {
    // Google-un tələb etdiyi yer budur.
    const body = layout.slice(layout.indexOf("<body>"));
    const ns = body.indexOf("<GtmNoScript");
    const providers = body.indexOf("<Providers");
    expect(ns).toBeGreaterThan(0);
    expect(ns, "noscript səhifə məzmunundan ƏVVƏL olmalıdır").toBeLessThan(providers);
  });

  it("ID paneldən oxunur, koda yazılmır", () => {
    // Dəyişmək/söndürmək üçün deploy lazım gəlməsin.
    expect(layout).toMatch(/inject\.gtmId/);

    // Şərhlər çıxarılır: sənəd blokundakı `GTM-XXXXXXX` NÜMUNƏSİ real ID
    // deyil, amma xam mətndə axtarsaq yalançı uyğunluq verir.
    const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
    for (const [name, src] of [["layout.js", layout], ["GoogleTagManager.jsx", gtm]]) {
      expect(strip(src), `${name}: ID koda sabit yazılıb`).not.toMatch(/GTM-[A-Z0-9]{6,}/);
    }
  });
});
