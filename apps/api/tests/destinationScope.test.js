import { describe, it, expect } from "vitest";
import { destinationScope, branchScope } from "#utils";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Xaricdə təhsil müraciətlərində ölkə əhatəsi.
 *
 * Məhdudiyyət SERVERDƏ tətbiq olunmalıdır. Filtri yalnız arayüzdə gizlətmək
 * təhlükəsizlik deyil — istifadəçi sorğunu əl ilə dəyişib icazəsi olmayan
 * ölkənin müraciətlərini görə bilərdi.
 */
describe("destinationScope", () => {
  it("developer və superadmin məhdudlaşdırılmır", () => {
    for (const role of ["developer", "superadmin"]) {
      expect(destinationScope({ role, allowedDestinations: ["a".repeat(24)] })).toBeNull();
    }
  });

  it("boş siyahı = məhdudiyyət yoxdur", () => {
    // permissions ilə eyni konvensiya: əks halda sahə əlavə olunan kimi
    // bütün mövcud adminlər müraciətləri görməyi dayandırardı.
    expect(destinationScope({ role: "admin", allowedDestinations: [] })).toBeNull();
    expect(destinationScope({ role: "admin" })).toBeNull();
  });

  it("dolu siyahı sətir massivi qaytarır", () => {
    const id = "6a96938ef18b3da0562c1eca";
    expect(destinationScope({ role: "admin", allowedDestinations: [id] })).toEqual([id]);
  });

  it("istifadəçi yoxdursa null", () => {
    expect(destinationScope(null)).toBeNull();
  });

  it("branchScope eyni qaydalarla işləyir", () => {
    const id = "6a96938ef18b3da0562c1eca";
    expect(branchScope({ role: "developer", allowedBranches: [id] })).toBeNull();
    expect(branchScope({ role: "admin", allowedBranches: [] })).toBeNull();
    expect(branchScope({ role: "admin", allowedBranches: [id] })).toEqual([id]);
  });
});

describe("əhatənin serverdə tətbiqi", () => {
  const SRC = fs.readFileSync(path.join(ROOT, "controllers/adminController.js"), "utf8");

  it("siyahı sorğusuna tətbiq olunur", () => {
    expect(SRC).toContain("applyLeadScope(filter, req, req.params.resource)");
  });

  it("filial əhatəsi də tətbiq olunur", () => {
    expect(SRC).toContain("branchScope(req.user)");
    // Filialsız müraciətlər kənarda qalmamalıdır — əks halda məhdud admin
    // onları heç görməzdi və müraciət cavabsız qalardı.
    expect(SRC).toMatch(/{ branch: null }/);
  });

  it("tək sənəd də yoxlanılır", () => {
    // Yalnız siyahını süzmək kifayət deyil: id-ni bilən istifadəçi
    // icazəsi olmayan müraciəti birbaşa aça bilərdi.
    //
    // Sərhəd `});` ilə hesablana bilməz — handler-in içində daha erkən
    // rast gəlir. Növbəti `const ...` təyinatına qədər götürülür.
    const from = SRC.indexOf("const getOne = asyncHandler");
    const next = SRC.indexOf("\nconst ", from + 10);
    const block = SRC.slice(from, next > 0 ? next : undefined);
    expect(block).toMatch(/destinationScope/);
    expect(block).toMatch(/status\(404\)/);
  });

  it("ölkəsiz müraciətlər əhatədən kənardır", () => {
    // Adi kurs müraciətlərində ölkə olmur — məhdud admin onları da
    // görməsəydi bölmə praktikada boş qalardı.
    expect(SRC).toMatch(/destinations: \{ \$size: 0 \}/);
  });
});
