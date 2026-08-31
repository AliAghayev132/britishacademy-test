import { describe, it, expect } from "vitest";
import { hasRole, canAccessSection, seesEverything } from "#utils";

// Rol və icazə məntiqi. Ən vacib hal MİQRASİYADIR: bu sistemdən əvvəl
// yaradılmış adminlərin `permissions` massivi boşdur — «boş = heç nə»
// qəbul etsək, deploy-dan sonra bütün mövcud adminlər paneldən kilidlənər.

describe("hasRole", () => {
  it("iyerarxiyaya görə müqayisə edir", () => {
    expect(hasRole({ role: "developer" }, "admin")).toBe(true);
    expect(hasRole({ role: "superadmin" }, "admin")).toBe(true);
    expect(hasRole({ role: "admin" }, "admin")).toBe(true);
    expect(hasRole({ role: "editor" }, "admin")).toBe(false);
    expect(hasRole({ role: "user" }, "admin")).toBe(false);
  });

  it("naməlum rol və boş istifadəçidə çökmür", () => {
    expect(hasRole({ role: "yoxdur" }, "admin")).toBe(false);
    expect(hasRole(null, "admin")).toBe(false);
    expect(hasRole(undefined, "admin")).toBe(false);
  });
});

describe("seesEverything", () => {
  it("yalnız superadmin və developer", () => {
    expect(seesEverything({ role: "developer" })).toBe(true);
    expect(seesEverything({ role: "superadmin" })).toBe(true);
    expect(seesEverything({ role: "admin" })).toBe(false);
  });
});

describe("canAccessSection", () => {
  it("superadmin/developer hər bölməni görür", () => {
    for (const role of ["superadmin", "developer"]) {
      expect(canAccessSection({ role, permissions: [] }, "users")).toBe(true);
      expect(canAccessSection({ role, permissions: [] }, "settings")).toBe(true);
    }
  });

  it("icazə verilmiş bölməni açır, verilməyəni bağlayır", () => {
    const u = { role: "admin", permissions: ["leads", "courses"] };
    expect(canAccessSection(u, "leads")).toBe(true);
    expect(canAccessSection(u, "courses")).toBe(true);
    expect(canAccessSection(u, "users")).toBe(false);
    expect(canAccessSection(u, "settings")).toBe(false);
  });

  it("MİQRASİYA: boş icazə = məhdudiyyət yoxdur", () => {
    // Köhnə adminlər kilidlənməməlidir.
    const legacy = { role: "admin", permissions: [] };
    expect(canAccessSection(legacy, "leads")).toBe(true);
    expect(canAccessSection(legacy, "settings")).toBe(true);

    // permissions ümumiyyətlə yoxdursa da eyni.
    expect(canAccessSection({ role: "admin" }, "leads")).toBe(true);
  });

  it("istifadəçi yoxdursa bağlıdır", () => {
    expect(canAccessSection(null, "leads")).toBe(false);
    expect(canAccessSection(undefined, "leads")).toBe(false);
  });
});
