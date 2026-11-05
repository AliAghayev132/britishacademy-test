import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * KURS FORMASINDA MÜƏLLİM SEÇİMİ.
 *
 * NASAZLIQ: «hər müəllim gəlmir». Seçim siyahısı `/admin/lookups`-dan gəlir
 * və öz teqi ilə keşlənirdi, amma müəllim (filial, kurs…) yaradanda /
 * dəyişəndə / siləndə həmin keş YENİLƏNMİRDİ. Panel açıq qaldıqca yeni
 * müəllim kursun «Müəllimlər» seçimində görünmürdü.
 *
 * Üstəlik 50+ müəllim çip kimi yan-yana düzülürdü — axtarış yox idi.
 */

const api = fs.readFileSync("src/store/api/adminApi.js", "utf8");
const wizard = fs.readFileSync("src/app/(protected)/dashboard/_forms/CourseWizard.jsx", "utf8");
const kit = fs.readFileSync("src/app/(protected)/dashboard/_forms/kit.jsx", "utf8");

describe("seçim siyahılarının keşi", () => {
  it("müəllim, filial, kurs, kateqoriya, ölkə dəyişəndə lookups yenilənir", () => {
    expect(api).toContain('const LOOKUP_RESOURCES = new Set(["branches", "teachers", "course-categories", "courses", "destinations"]);');
    // Yaratma, redaktə, silmə və sıralama — dördü də.
    expect(api.match(/withLookups\(resource, \[/g)).toHaveLength(4);
  });

  it("kurs (wizard) yaradılanda / yenilənəndə də", () => {
    expect(api.match(/LOOKUPS_TAG,\n/g)).toHaveLength(2);
  });

  it("forma hər açılanda siyahını təzədən alır", () => {
    expect(wizard).toContain("useAdminLookupsQuery(undefined, { refetchOnMountOrArgChange: true })");
  });
});

describe("axtarışlı seçim", () => {
  it("müəllimlər axtarışlı siyahı ilə seçilir", () => {
    expect(wizard).toMatch(/<SearchableMultiSelect\s+options=\{teacherOpts\}/);
  });

  it("axtarış AZ hərflərinə həssas deyil (ə→e, ı→i, diakritika atılır)", () => {
    expect(kit).toContain('.replace(/ə/g, "e")');
    expect(kit).toContain('.replace(/ı/g, "i")');
    expect(kit).toContain(".replace(/\\p{M}/gu, \"\")");
  });

  it("silinmiş, amma kursda qalan müəllim səssizcə itmir", () => {
    expect(kit).toContain('label: "Silinmiş element", missing: true');
  });
});
