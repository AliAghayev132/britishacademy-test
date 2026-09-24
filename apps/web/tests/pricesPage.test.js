import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { LEGACY_REDIRECTS } from "@/lib/legacyRoutes";

/**
 * /kurslar/qiymetler — bütün kursların qiymət cədvəli.
 *
 * Səhifə statik seqmentdir və `/kurslar/[slug]` dinamik marşrutundan əvvəl
 * gəlir; qiymətlər əl ilə yazılmır, `/courses` cavabındakı filial matrisindən
 * hesablanır.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const PAGE = "src/app/(public)/kurslar/qiymetler/page.js";

describe("qiymət cədvəli səhifəsi", () => {
  it("qiymətlər əl ilə yazılmır — filial matrisindən hesablanır", () => {
    const src = read(PAGE);
    expect(src).toMatch(/apiGet\("\/courses"\)/);
    expect(src).toMatch(/function priceRange\(course, kind, time\)/);
    // Hər xana matrisdən gəlir — koda yazılmış qiymət xanası olmamalıdır.
    // (FAQ mətnindəki «+10 AZN» kimi izahlar sayılmır, onlar xana deyil.)
    expect(src).not.toMatch(/style=\{num\}>\s*\d/);
  });

  it("«custom» rejimli kursun qiyməti də göstərilir", () => {
    // Bu kursların qiyməti matrisdə yox, `customPricing`-dədir (seans üzrə).
    // Əvvəl belə kurs qiyməti olmasına baxmayaraq «Qiymət üçün əlaqə» kimi
    // görünürdü.
    const src = read(PAGE);
    expect(src).toMatch(/const customRows = \(course\) =>/);
    expect(src).toMatch(/customRows\(course\)\.length \? \(/);
    // `td`-nin özünə `display: flex` verilsə xana cədvəl xanası olmaqdan
    // çıxır və `colSpan` işləmir — flex daxili div-dədir.
    expect(src).not.toMatch(/<td colSpan=\{COLS\.length\} style=\{\{ \.\.\.td, display: "flex"/);
  });

  it("üç dildə mətn var və hər dil eyni açarları daşıyır", () => {
    const src = read(PAGE);
    for (const lang of ["az:", "en:", "ru:"]) expect(src).toContain(`  ${lang}`);
    for (const key of ["metaTitle", "metaDesc", "onRequest", "faqTitle"]) {
      expect(src.split(`${key}:`).length - 1, key).toBe(3);
    }
  });

  it("cədvəl mobildə öz konteynerində sürüşür", () => {
    // `minWidth` olan cədvəl birbaşa səhifədə olsaydı bütün səhifə yana
    // sürüşərdi.
    expect(read(PAGE)).toMatch(/overflowX: "auto"/);
  });

  it("köhnə qiymət ünvanı yeni səhifəyə yönlənir", () => {
    expect(LEGACY_REDIRECTS["/ingilis-dili-kurslari-qiymetleri"]).toBe("/kurslar/qiymetler");
    // IELTS qiyməti kursun öz səhifəsində qalır — orada filial üzrə dəqiq
    // cədvəl var, bu niyyət üçün daha spesifikdir.
    expect(LEGACY_REDIRECTS["/ielts-kurslari-qiymetleri"]).toBe("/kurslar/ielts-kurslari");
  });

  it("hub və kurs səhifəsindən daxili keçid var", () => {
    for (const f of ["src/app/(public)/kurslar/page.js", "src/app/(public)/kurslar/[slug]/page.js"]) {
      expect(read(f), f).toMatch(/href="\/kurslar\/qiymetler"/);
    }
  });
});
