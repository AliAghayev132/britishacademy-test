import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Təyin olunmamış identifikator yoxlaması.
 *
 * NİYƏ TEST, HALBUKİ LINT VAR:
 * Bu səhv üç dəfə istehsalata çıxdı — ROLE_RANK, hasRole, resolveAiConfig.
 * Hər dəfə eyni ssenari: funksiya çağırılır, amma importu fayla əlavə
 * olunmayıb. ESM modulu belə vəziyyətdə problemsiz yüklənir; ReferenceError
 * yalnız həmin sətir İCRA olunanda atılır. Ona görə nə "modul import olunur"
 * yoxlaması, nə də adi test bunu tuturdu — istifadəçi 500 alırdı.
 *
 * Lint bunu tutur, lakin lint ayrı əmrdir və CI-də ayrı addımdır. Bu test
 * eyni yoxlamanı `pnpm test`-in içinə salır ki, qayda söndürülsə və ya fayl
 * ignore-a düşsə belə, boşluq gözdən qaçmasın.
 */
describe("no-undef mühafizəsi", () => {
  it("heç bir mənbə faylında təyin olunmamış identifikator yoxdur", async () => {
    const eslint = new ESLint({ cwd: ROOT });
    const results = await eslint.lintFiles(["."]);

    const undef = results.flatMap((r) =>
      r.messages
        .filter((m) => m.ruleId === "no-undef")
        .map((m) => `${path.relative(ROOT, r.filePath)}:${m.line} — ${m.message}`),
    );

    expect(undef, `Import çatışmır:\n  ${undef.join("\n  ")}`).toEqual([]);
  }, 90_000);

  it("no-undef qaydası ESLint konfiqurasiyasında aktiv qalır", () => {
    // Qayda söndürülsə yuxarıdakı test də susardı — ona görə ayrıca yoxlanılır.
    const cfg = fs.readFileSync(path.join(ROOT, "eslint.config.js"), "utf8");
    expect(cfg).toMatch(/"no-undef":\s*"error"/);
  });
});
