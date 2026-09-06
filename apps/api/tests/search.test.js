import { describe, it, expect } from "vitest";
import { SOURCES } from "../controllers/searchController.js";

/**
 * Sayt üzrə ümumi axtarış.
 *
 * TAPILMIŞ NASAZLIQ: süzgəc bütün mənbələr üçün sabit `isActive: true`
 * yazılmışdı. BlogPost-da isə belə sahə YOXDUR — dərc vəziyyəti `status` ilə
 * idarə olunur. Nəticədə axtarış bütün bloq yazılarını səssizcə kənarda
 * qoyardı: xəta çıxmaz, sadəcə «tapılmadı» yazardı.
 *
 * Aşağıdakı testlər sxem ilə süzgəci bir-birinə bağlayır.
 */

describe("axtarış mənbələri", () => {
  it("səkkiz mənbə var və açarlar təkrarlanmır", () => {
    expect(SOURCES.length).toBe(8);
    const keys = SOURCES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("hər mənbənin süzgəci MODELDƏ OLAN sahələrə istinad edir", () => {
    const bad = [];
    for (const s of SOURCES) {
      for (const field of Object.keys(s.base || {})) {
        if (!s.model.schema.path(field)) bad.push(`${s.key}.base.${field}`);
      }
    }
    expect(bad, `sxemdə olmayan sahə: ${bad.join(", ")}`).toEqual([]);
  });

  it("axtarılan sahələr modeldə var", () => {
    const bad = [];
    for (const s of SOURCES) {
      for (const f of s.fields) {
        if (!s.model.schema.path(f)) bad.push(`${s.key}.${f}`);
      }
    }
    expect(bad, `sxemdə olmayan axtarış sahəsi: ${bad.join(", ")}`).toEqual([]);
  });

  it("silinmiş sənədlər hər mənbədə kənarda qalır", () => {
    for (const s of SOURCES) {
      expect(s.base.isDeleted, `${s.key} silinmişləri süzmür`).toBe(false);
    }
  });

  it("bloq YALNIZ dərc olunmuşları göstərir", () => {
    // Qaralama yazı public axtarışda görünməməlidir.
    const blog = SOURCES.find((s) => s.key === "blog");
    expect(blog.base.status).toBe("published");
    // `isActive` yazılmamalıdır — modeldə belə sahə yoxdur.
    expect(blog.base.isActive).toBeUndefined();
  });

  it("hər mənbə etibarlı ünvan qurur", () => {
    for (const s of SOURCES) {
      const href = s.href({ slug: "test-slug" });
      expect(href, s.key).toMatch(/^\/[a-z0-9/-]*test-slug$/);
    }
  });

  it("hər mənbə üç dildə etiketlidir", () => {
    for (const s of SOURCES) {
      for (const l of ["az", "en", "ru"]) {
        expect(s.label[l], `${s.key}.${l}`).toBeTruthy();
      }
    }
  });

  it("`select` axtarılan başlıq sahəsini daxil edir", () => {
    // `select` başlığı buraxsa, nəticə boş adla görünərdi.
    for (const s of SOURCES) {
      const fields = s.select.split(/\s+/);
      const hasTitle = ["title", "fullName", "name", "country"].some((t) => fields.includes(t));
      expect(hasTitle, `${s.key}: select-də başlıq sahəsi yoxdur`).toBe(true);
      expect(fields, `${s.key}: select-də slug yoxdur`).toContain("slug");
    }
  });
});
