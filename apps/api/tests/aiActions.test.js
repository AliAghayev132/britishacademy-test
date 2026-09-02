import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fs.readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../controllers/aiController.js",
  ),
  "utf8",
);

/**
 * AI əməliyyatlarının bütövlüyü.
 *
 * Kontroller iki ayrı yerdə əməliyyat adı sadalayır: `switch` bloku (prompt
 * qurulur) və JSON parse şərti (cavab obyektə çevrilir). Yeni əməliyyat
 * birinciyə əlavə olunub ikinciyə unudulanda səhv SƏSSİZ olur — server 200
 * qaytarır, amma `result` obyekt yerinə xam mətn gəlir və forma sahələri
 * doldurulmur. Bu test həmin uyğunsuzluğu tutur.
 */

/** switch bloklarındakı `case "..."` adları. */
const cases = [...SRC.matchAll(/case\s+"([a-z-]+)":/g)].map((m) => m[1]);

/** JSON parse şərtindəki `action === "..."` adları. */
const parsed = [
  ...SRC.matchAll(/action\s*===\s*"([a-z-]+)"/g),
].map((m) => m[1]);

describe("AI əməliyyatları", () => {
  it("seo-suite switch blokunda var", () => {
    expect(cases).toContain("seo-suite");
  });

  it("struktur qaytaran hər əməliyyat JSON kimi parse olunur", () => {
    // Bu əməliyyatlar modeldən JSON istəyir — parse edilməsələr forma
    // sahələrinə xam mətn düşər.
    for (const a of ["generate-keywords", "generate-seo", "seo-suite"]) {
      expect(cases, `${a} switch-də yoxdur`).toContain(a);
      expect(parsed, `${a} JSON parse şərtində yoxdur`).toContain(a);
    }
  });

  it("seo-suite üç dili də prompt-da tələb edir", () => {
    // Tək dil qaytarsa forma EN/RU-nu boş doldurar.
    const block = SRC.slice(SRC.indexOf('case "seo-suite"'));
    expect(block).toMatch(/"az"/);
    expect(block).toMatch(/"en"/);
    expect(block).toMatch(/"ru"/);
  });

  it("seo-suite üçün token limiti artırılıb", () => {
    // Üç dil defolt 1500 tokenə sığmır — cavab yarımçıq kəsilib JSON parse
    // olunmurdu.
    expect(SRC).toMatch(/action === "seo-suite" \? \d{4}/);
  });
});
