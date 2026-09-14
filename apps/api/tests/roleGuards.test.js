import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { hasRole, canAccessSection } from "#utils";

/**
 * ROL YOXLAMALARININ QORUYUCU TESTİ.
 *
 * Bu layihədə eyni baq İKİ DƏFƏ təkrarlandı: rol yoxlaması sərt bərabərliklə
 * yazılırdı (role === "admin"), sonra rol siyahısı genişlənəndə daha
 * SƏLAHİYYƏTLİ rollar bloklanırdı.
 *
 * İkinci dəfə nəticə tam kilidlənmə oldu: route superadmin/developer
 * tələb edirdi, controller isə dəqiq "admin" — yəni heç kim istifadəçi
 * idarə edə bilmirdi.
 *
 * Bu test mənbə kodunu yoxlayır: rol müqayisəsi iyerarxiya funksiyası ilə
 * edilməlidir, sərt bərabərliklə yox.
 */

const API_ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Yoxlanılan qovluqlardakı bütün .js faylları — alt qovluqlar da daxil
 * (bölünmüş modullar controllers/public/, services/whatsapp/ və s. altındadır).
 */
function collect(dir) {
  const full = path.join(API_ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return collect(rel);
    return e.name.endsWith(".js") ? [{ rel, text: fs.readFileSync(path.join(full, e.name), "utf8") }] : [];
  });
}

describe("rol yoxlamaları iyerarxiya ilə edilir", () => {
  // Developer alətləri qəsdən istisnadır: onlar YALNIZ developer
  // rolundadır, orada iyerarxiya deyil, dəqiq rol tələb olunur.
  const EXEMPT = new Set(["controllers/dev/devTool.js"]);

  const files = [...collect("controllers"), ...collect("services")];

  it("yoxlanılacaq fayl tapılır", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const { rel, text } of files) {
    if (EXEMPT.has(rel)) continue;

    it(`${rel}: sərt rol bərabərliyi yoxdur`, () => {
      // `role === "admin"` və ya `role !== "admin"` kimi müqayisələr.
      // superadmin/developer daha səlahiyyətlidir və belə yoxlamalardan keçmir.
      const hits = [...text.matchAll(/role\s*[!=]==\s*"(admin|editor)"/g)].map((m) => m[0]);
      expect(hits).toEqual([]);
    });
  }
});

describe("hasRole iyerarxiyası", () => {
  it("daha səlahiyyətli rol aşağı tələbi ödəyir", () => {
    // Baqın kökü: bu gözləntilər pozulanda superadmin/developer bloklanır.
    expect(hasRole({ role: "developer" }, "admin")).toBe(true);
    expect(hasRole({ role: "developer" }, "superadmin")).toBe(true);
    expect(hasRole({ role: "superadmin" }, "admin")).toBe(true);
    expect(hasRole({ role: "admin" }, "editor")).toBe(true);
  });

  it("aşağı rol yuxarı tələbi ödəmir", () => {
    expect(hasRole({ role: "admin" }, "superadmin")).toBe(false);
    expect(hasRole({ role: "editor" }, "admin")).toBe(false);
    expect(hasRole({ role: "superadmin" }, "developer")).toBe(false);
  });

  it("istifadəçi idarəsi superadmin+ tələb edir", () => {
    const canManage = (u) => hasRole(u, "superadmin");
    expect(canManage({ role: "developer" })).toBe(true);
    expect(canManage({ role: "superadmin" })).toBe(true);
    expect(canManage({ role: "admin" })).toBe(false);
    expect(canManage({ role: "editor" })).toBe(false);
  });
});

describe("developer bütün bölmələrə çıxa bilir", () => {
  it("icazə siyahısı boş olsa da", () => {
    const dev = { role: "developer", permissions: [] };
    for (const s of ["users", "settings", "developer", "leads", "home"]) {
      expect(canAccessSection(dev, s)).toBe(true);
    }
  });
});
