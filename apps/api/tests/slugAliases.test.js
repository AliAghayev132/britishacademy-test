import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SLUG_RENAMES, LEGACY_SLUG_OF } from "../data/slugAliases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Slug köçürməsinin təhlükəsizlik şəbəkəsi.
 *
 * KONKRET NASAZLIQ: kurs slugları köhnə saytın ünvanlarına uyğunlaşdırıldı və
 * proxy köhnə ünvanı yeniyə 301 ilə yönləndirdi. Lakin slug dəyişikliyi BAZADA
 * ayrıca miqrasiya tələb edir və o, deploy-dan sonra işlədilmədi. Nəticə:
 *
 *   /kurslar/ingilis-dili-kursu → 301 → /kurslar/ingilis-dili-kurslari → 404
 *
 * Üç ən çox baxılan kurs (İngilis dili, IELTS, SAT) istehsalatda tamamilə
 * əlçatmaz oldu. Kod deploy-u ilə baza miqrasiyası arasındakı bu asılılıq
 * publicController-dəki ehtiyat axtarışla aradan qaldırıldı.
 */
describe("slug alias xəritəsi", () => {
  it("əks indeks düzgün qurulur", () => {
    for (const [from, to] of Object.entries(SLUG_RENAMES)) {
      expect(LEGACY_SLUG_OF[to]).toBe(from);
    }
    expect(Object.keys(LEGACY_SLUG_OF)).toHaveLength(
      Object.keys(SLUG_RENAMES).length,
    );
  });

  it("köhnə və yeni sluglar bir-birinə qarışmır", () => {
    // Bir slug həm köhnə, həm yeni ola bilməz — zəncirvari köçürmə
    // (a→b, b→c) miqrasiyanı qeyri-müəyyən edərdi.
    const olds = new Set(Object.keys(SLUG_RENAMES));
    for (const to of Object.values(SLUG_RENAMES)) {
      expect(olds.has(to)).toBe(false);
    }
  });

  it("publicController ehtiyat axtarışı işlədir", () => {
    // Mənbə yoxlaması: ehtiyat axtarış silinsə 301→404 zənciri geri qayıdar,
    // adi testlər isə bunu tutmaz (baza lazımdır).
    const src = fs.readFileSync(
      path.join(ROOT, "controllers/publicController.js"),
      "utf8",
    );
    expect(src).toContain("LEGACY_SLUG_OF");
    expect(src).toMatch(/LEGACY_SLUG_OF\[req\.params\.slug\]/);
  });

  it("miqrasiya servisi eyni mənbədən oxuyur", () => {
    // İki yerdə ayrıca siyahı saxlansaydı biri yenilənib digəri unudula bilərdi.
    const src = fs.readFileSync(
      path.join(ROOT, "services/SlugMigrationService.js"),
      "utf8",
    );
    expect(src).toContain("data/slugAliases.mjs");
    expect(src).not.toMatch(/SLUG_RENAMES\s*=\s*\{/);
  });
});
