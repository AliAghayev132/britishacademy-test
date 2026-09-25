import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * FİLİALIN ÖZ SƏHİFƏSİ — /filiallar/<slug>.
 *
 * ── TAPILAN BOŞLUQ ──
 * API hər filial üçün `/filiallar/<slug>` ünvanı elan edirdi (Branch
 * modelinin `url` virtualı), amma Next-də belə marşrut yox idi: ünvan 404
 * verirdi və sitemap-dan qəsdən çıxarılmışdı. Dörd filialın heç birinin
 * lokal axtarış üçün öz səhifəsi yox idi.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const PAGE = "src/app/(public)/filiallar/[slug]/page.js";

describe("filial səhifəsi", () => {
  it("marşrut var və şəbəkə xətası 404 kimi oxunmur", () => {
    const src = read(PAGE);
    expect(src).toMatch(/apiGetStatus\(`\/branches\/\$\{slug\}`\)/);
    // `isMissing` olmasa API çökəndə real filial səhifəsi indeksdən düşərdi.
    expect(src).toMatch(/if \(isMissing\(res, "branch"\)\) notFound\(\);/);
  });

  it("lokal axtarış üçün struktur məlumatı verir", () => {
    const src = read(PAGE);
    expect(src).toMatch(/"@type": "EducationalOrganization"/);
    expect(src).toMatch(/"@type": "PostalAddress"/);
    expect(src).toMatch(/"@type": "GeoCoordinates"/);
    expect(src).toMatch(/openingHours:/);
    expect(src).toMatch(/"@type": "BreadcrumbList"/);
    // JSON-LD ünvanları cari dilə görə qurulmalıdır (audit #31).
    expect(src).toMatch(/absUrl\(`\/filiallar\/\$\{b\.slug\}`, locale\)/);
  });

  it("kurs siyahısı qiymət matrisindən gəlir, əl ilə yazılmır", () => {
    const src = read(PAGE);
    expect(src).toMatch(/\(course\.pricing \|\| \[\]\)\.find/);
    expect(src).not.toMatch(/\b\d{2,3} AZN["']/);
  });

  it("siyahı səhifəsindən detala keçid var", () => {
    const list = read("src/app/(public)/filiallar/page.js");
    expect(list.split("/filiallar/${b.slug}").length - 1).toBeGreaterThanOrEqual(2);
  });

  it("tək filialda xəritə seçim çipləri göstərilmir", () => {
    // Filialın öz səhifəsində seçiləcək ikinci filial yoxdur.
    expect(read("src/components/site/BranchMapSwitcher.jsx")).toMatch(/\{branches\.length > 1 && \(/);
  });

  it("səhifəyə aid mətnlər üç dildədir", () => {
    const s = read("src/lib/i18n/strings.js");
    for (const key of ["page.branch.contact", "page.branch.hours", "page.branch.courses", "page.branch.others", "meta.branch.tail"]) {
      expect(s.split(`"${key}"`).length - 1, key).toBe(3);
    }
  });
});
