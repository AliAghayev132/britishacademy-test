import { describe, it, expect } from "vitest";
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
});
