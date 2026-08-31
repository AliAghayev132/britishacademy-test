import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import "#models";
import { LOCALIZED_FIELDS } from "#utils";

/**
 * ÖRTÜK TESTİ — çoxdilli sahələr qeydiyyatdan kənarda qalmasın.
 *
 * `localizedField()` sahəni Mixed tipdə yaradır, amma bu, TƏK BAŞINA
 * kifayət deyil: sahə həm də LOCALIZED_FIELDS-də qeyd olunmalıdır, əks
 * halda i18nPlugin onu normallaşdırmır və AI toplu tərcümə onu görmür —
 * sahə səssizcə yalnız azərbaycanca qalır.
 *
 * Bu test yeni sahə əlavə edən adamı xəbərdar edir: hero-ya yeni mətn
 * qoyulduqda LOCALIZED_FIELDS-ə də yazılmalıdır.
 */

/** Sxemdə localizedField() ilə yaradılmış sahələri tap. */
function localizedPaths(schema) {
  return Object.entries(schema.paths)
    .filter(([, p]) => p.instance === "Mixed" && p.defaultValue === "")
    .map(([k]) => k);
}

describe("çoxdilli sahələrin örtüyü", () => {
  const models = Object.keys(LOCALIZED_FIELDS);

  it("qeydiyyatda ən azı 15 model var", () => {
    expect(models.length).toBeGreaterThanOrEqual(15);
  });

  for (const name of models) {
    it(`${name}: bütün Mixed mətn sahələri qeydiyyatdadır`, () => {
      let Model;
      try {
        Model = mongoose.model(name);
      } catch {
        return; // model yoxdursa bu test aid deyil
      }
      const registered = new Set(LOCALIZED_FIELDS[name]);
      const missing = localizedPaths(Model.schema).filter((p) => !registered.has(p));
      expect(missing).toEqual([]);
    });
  }

  it("hero-nun BÜTÜN mətn sahələri 3 dillidir", () => {
    // Müştəri tələbi: hero-dakı hər yazı üç dildə redaktə oluna bilməlidir.
    const hero = LOCALIZED_FIELDS.SiteSetting.filter((p) => p.startsWith("hero."));
    expect(hero).toEqual(
      expect.arrayContaining([
        "hero.titlePrefix",
        "hero.subtitle",
        "hero.words",
        "hero.chipsLeft",
        "hero.chipsRight",
        "hero.pills",
      ]),
    );
  });

  it("hero.colors lokallaşdırılmır (mətn deyil, rəng kodları)", () => {
    expect(LOCALIZED_FIELDS.SiteSetting).not.toContain("hero.colors");
  });
});
