import { describe, it, expect } from "vitest";
import { RESOURCES, RESOURCE_SECTION } from "../controllers/resourceRegistry.js";
import { ABROAD_INTEREST } from "../controllers/adminController.js";
import { adminSections } from "#constants";

/**
 * İCAZƏ SİSTEMİNİN BÜTÖVLÜYÜ.
 *
 * TAPILMIŞ NASAZLIQ: `/admin/:resource` marşrutları heç bir bölmə
 * yoxlamasından keçmirdi. Yəni icazələr YALNIZ sidebar-ı gizlədirdi — yalnız
 * «müraciətlər» icazəsi olan admin sorğunu əl ilə yazıb kursları,
 * müəllimləri, testləri, linkləri və logları oxuya bilirdi.
 *
 * Bu testlər qorumanın DƏLİKSİZ qalmasını təsbit edir: reyestrə yeni resurs
 * əlavə edən adam bölməsini də yazmalıdır, əks halda test sınır.
 */

describe("resurs → bölmə xəritəsi", () => {
  it("HƏR resurs üçün bölmə təyin olunub", () => {
    const missing = Object.keys(RESOURCES).filter((r) => !RESOURCE_SECTION[r]);
    // Bölməsi olmayan resurs `denySection`-da fail-closed olur (403), yəni
    // sistem sınmır — amma admin bölməni heç cür aça bilmir.
    expect(missing, `bölməsi yazılmayan resurs: ${missing.join(", ")}`).toEqual([]);
  });

  it("xəritədə uydurma resurs yoxdur", () => {
    const extra = Object.keys(RESOURCE_SECTION).filter((r) => !RESOURCES[r]);
    expect(extra, `reyestrdə olmayan resurs: ${extra.join(", ")}`).toEqual([]);
  });

  it("işlədilən bölmələr ağ siyahıdadır", () => {
    // Ağ siyahıda olmayan bölmə istifadəçiyə TƏYİN EDİLƏ BİLMİR — yəni həmin
    // resurs məhdud admin üçün əbədi bağlı qalardı.
    const unknown = [...new Set(Object.values(RESOURCE_SECTION))].filter(
      (s) => !adminSections.includes(s),
    );
    expect(unknown, `adminSections-də yoxdur: ${unknown.join(", ")}`).toEqual([]);
  });
});

describe("müraciətlərin iki bölməyə ayrılması", () => {
  it("hər iki bölmə ağ siyahıdadır", () => {
    expect(adminSections).toContain("leads");
    expect(adminSections).toContain("leads-abroad");
  });

  it("«Layihələr» bölməsi ağ siyahıdadır", () => {
    // Sidebar `section: 'projects'` işlədirdi, amma açar nə serverin ağ
    // siyahısında, nə də panelin SECTIONS siyahısında vardı. Nəticədə
    // ["projects"] göndərmək icazəni BOŞALDIRDI — boş isə «məhdudiyyət
    // yoxdur» deməkdir, yəni istifadəçi tam səlahiyyət alırdı.
    expect(adminSections).toContain("projects");
  });

  it("xaricdə təhsil əlaməti panelin göndərdiyi dəyərlə eynidir", () => {
    // Panel süzgəci `interest=Xaricdə təhsil` göndərir (muracietler/page.js),
    // ApplyModal müraciəti belə yazır. Sətir dəyişsə sərhəd səssizcə açılardı.
    expect(ABROAD_INTEREST).toBe("Xaricdə təhsil");
  });
});
