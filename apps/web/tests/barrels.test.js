import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

/**
 * Barrel-lər avtomatik yaradılır (scripts/imports-codemod.cjs). Yeni modul
 * əlavə olunub `pnpm barrels` unudulanda import `@/components`-dən tapılmır;
 * bu test onu CI-da tutur.
 */
describe("barrel-lər və import qaydaları", () => {
  it("pnpm barrels:check keçir", () => {
    const run = () => execFileSync(process.execPath, ["scripts/imports-codemod.cjs", "web", "--check"], { encoding: "utf8" });
    expect(run).not.toThrow();
  }, 60_000);

  it("komponentlərin daxili hissələri @/components-ə sızmır", () => {
    const barrel = fs.readFileSync("src/components/index.js", "utf8");
    for (const inner of ["./site/header/", "./site/quiz/", "./ui/qr-studio/", "./sidebar/"]) {
      expect(barrel, inner).not.toContain(inner);
    }
    // Açıq qovluq index-i isə ixrac olunur.
    expect(barrel).toMatch(/export \{ CourseCard, DestinationCard, SectionHead, TestimonialCard \} from "\.\/site\/cards";/);
  });
});
