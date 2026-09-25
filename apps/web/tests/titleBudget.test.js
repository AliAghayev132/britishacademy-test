import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { defaultsFor } from "@/lib/seo";

/**
 * AXTARIŞ NƏTİCƏSİNDƏ GÖRÜNƏN BAŞLIQ.
 *
 * ── TAPILAN NASAZLIQ ──
 * `titleTemplate` («%s — British Academy») hər başlığa qoşulurdu. Data
 * tərəfində ≤65 qaydasına əməl olunur (apps/api tests/pageContent.test.js),
 * amma o qayda XAM `metaTitle`-ı ölçür — şəkilçi isə daha 19 simvol gətirir.
 * Nəticədə Google-un gördüyü başlıq büdcəni keçirdi:
 *
 *     /                         71
 *     /en                       76
 *     /ru                       80
 *     /kurslar/qiymetler        77
 *     /xaricde-tehsil/almaniya  70
 *
 * Kəsilən hissə həmişə sonda olan brend adı idi — yəni şəkilçi onsuz da
 * görünmürdü, üstəlik başlığın öz sonunu da özü ilə aparırdı.
 *
 * ── HƏLL ──
 * Şəkilçi yalnız nəticə büdcəyə sığanda qoşulur; başlıqda brend adı artıq
 * varsa təkrarlanmır. Ana səhifənin defolt başlıqları da qısaldıldı — onlar
 * şablondan keçmir, olduğu kimi çıxır.
 */

const TITLE_MAX = 65;
const src = fs.readFileSync("src/lib/seo.js", "utf8").replace(/\r\n/g, "\n");

describe("başlıq büdcəsi", () => {
  it("hər dilin defolt başlığı büdcəyə sığır", () => {
    for (const locale of ["az", "en", "ru"]) {
      const { title } = defaultsFor(locale);
      expect(title.length, `${locale}: «${title}»`).toBeLessThanOrEqual(TITLE_MAX);
    }
  });

  it("şəkilçi yalnız sığanda qoşulur, brend təkrarlanmır", () => {
    // Şablon birbaşa `%s`-ə yapışdırılsaydı büdcə yoxlanmazdı.
    expect(src).not.toMatch(/const composed = title \? titleTemplate\.replace\("%s", title\) : defTitle;/);
    expect(src).toMatch(/function applyTitleTemplate\(template, title, brand\)/);
    expect(src).toMatch(/if \(brand && title\.includes\(brand\)\) return title;/);
    expect(src).toMatch(/return composed\.length > TITLE_MAX \? title : composed;/);
    expect(src).toMatch(/const TITLE_MAX = 65;/);
  });
});

describe("kateqoriya hub-ları", () => {
  const page = fs.readFileSync("src/app/(public)/kurslar/[slug]/page.js", "utf8").replace(/\r\n/g, "\n");

  it("meta təsvir kurs adlarından qurulur, sabit şablon deyil", () => {
    // Əvvəl yeddi hub üçün demək olar eyni 56–60 simvolluq mətn gedirdi.
    expect(page).toMatch(/async function categoryDescription\(cat, tr\)/);
    expect(page).toMatch(/meta\.categoryTail/);
    expect(page).not.toMatch(/description: cat\.lead \|\| `\$\{cat\.name\} — \$\{tr\("meta\.categoryDesc"\)\}`/);
  });

  it("hub ItemList və BreadcrumbList struktur məlumatı verir", () => {
    // `/kurslar` hub-ında var idi, kateqoriya hub-larında yox idi.
    const hub = page.slice(page.indexOf("async function CategoryHub"), page.indexOf("// ── Subcomponents ──"));
    expect(hub).toMatch(/"@type": "ItemList"/);
    expect(hub).toMatch(/"@type": "BreadcrumbList"/);
    expect(hub).toMatch(/ldJson\(ld\)/);
    // JSON-LD ünvanları cari dilin ünvanları olmalıdır (audit #31).
    expect(hub).toMatch(/absUrl\(`\/kurslar\/\$\{c\.slug\}`, locale\)/);
  });

  it("üç dildə mətn açarı var", () => {
    const strings = fs.readFileSync("src/lib/i18n/strings.js", "utf8");
    expect(strings.split('"meta.categoryTail"').length - 1).toBe(3);
  });
});
