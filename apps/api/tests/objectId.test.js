import { describe, it, expect } from "vitest";
import { isObjectId, cleanIds } from "#utils";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * ObjectId yoxlaması.
 *
 * İSTEHSALAT NASAZLIĞI: eyni reqeks üç yerə köçürülmüşdü və hər üçündə `\d`
 * təsadüfən `d`-yə çevrilmişdi — /^[a-fd]{24}$/i. Belə naxış RƏQƏM QƏBUL
 * ETMİR, halbuki ObjectId-lərin demək olar hamısında rəqəm var.
 *
 * Nəticə səssiz məlumat itkisi idi:
 *   • müraciət formasında seçilən ölkələr bazaya düşmürdü
 *   • layihə müraciəti layihəyə bağlanmırdı
 *   • istifadəçiyə verilən ölkə/filial icazələri yazılmırdı
 * Heç bir xəta çıxmırdı — forma «göndərildi» deyirdi.
 */
describe("isObjectId", () => {
  it("rəqəmli id-ləri qəbul edir", () => {
    // Məhz bu hal sınıq idi.
    expect(isObjectId("6a99baa6ccda2b91f6139d7e")).toBe(true);
    expect(isObjectId("000000000000000000000000")).toBe(true);
    expect(isObjectId("123456789012345678901234")).toBe(true);
  });

  it("böyük hərfləri qəbul edir", () => {
    expect(isObjectId("6A99BAA6CCDA2B91F6139D7E")).toBe(true);
  });

  it("səhv formanı rədd edir", () => {
    for (const v of ["", null, undefined, "qisa", "6a99baa6ccda2b91f6139d7", "6a99baa6ccda2b91f6139d7ez", "zzzzzzzzzzzzzzzzzzzzzzzz", { $ne: null }]) {
      expect(isObjectId(v), String(v)).toBe(false);
    }
  });
});

describe("cleanIds", () => {
  const id = "6a99baa6ccda2b91f6139d7e";

  it("yalnız etibarlıları saxlayır", () => {
    expect(cleanIds([id, "pis", 42, null, id])).toEqual([id, id]);
  });

  it("massiv olmayan dəyər boş massiv verir", () => {
    for (const v of [null, undefined, "sətir", 5, { a: 1 }]) expect(cleanIds(v)).toEqual([]);
  });

  it("həddi gözləyir", () => {
    expect(cleanIds(Array(30).fill(id), 12)).toHaveLength(12);
  });
});

describe("sınıq reqeks geri qayıtmır", () => {
  it("heç bir kontrollerdə [a-fd] naxışı yoxdur", () => {
    const dir = path.join(ROOT, "controllers");
    const bad = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".js"))
      .filter((f) => fs.readFileSync(path.join(dir, f), "utf8").includes("a-fd]"));
    expect(bad, `sınıq reqeks: ${bad.join(", ")}`).toEqual([]);
  });
});
