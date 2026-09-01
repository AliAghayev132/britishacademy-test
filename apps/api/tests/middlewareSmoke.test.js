import { describe, it, expect } from "vitest";
import { canAssignRole, requireSection, requireRole, cacheHeaders } from "#middlewares";

/**
 * MIDDLEWARE ÇAĞIRIŞ TESTİ.
 *
 * Bu, konkret bir baqdan sonra yazıldı: `canAssignRole` daxildə ROLE_RANK
 * işlədirdi, amma həmin import fayla ƏLAVƏ OLUNMAMIŞDI. ESM modulu
 * problemsiz yüklənir — ReferenceError yalnız funksiya ÇAĞIRILANDA baş
 * verir. Nəticədə istifadəçi redaktəsi 500 qaytarırdı, mənim «modul
 * qrafiki yüklənir» yoxlamam isə yaşıl idi.
 *
 * Ona görə burada hər middleware HƏQİQƏTƏN icra olunur.
 */

/** Sadə Express cavab saxtası — status kodunu tutur. */
function fakeRes() {
  const out = { code: null, body: null };
  return {
    out,
    status(c) {
      out.code = c;
      return this;
    },
    json(b) {
      out.body = b;
      return this;
    },
    set() {
      return this;
    },
  };
}

/** Middleware-i icra et; "next" qaytarır və ya status kodu. */
function run(mw, req) {
  const res = fakeRes();
  let nexted = false;
  mw(req, res, () => {
    nexted = true;
  });
  return nexted ? "next" : res.out.code;
}

describe("canAssignRole icra olunur", () => {
  it("ReferenceError atmır", () => {
    expect(() => canAssignRole("developer", "admin")).not.toThrow();
  });

  it("iyerarxiyaya görə qərar verir", () => {
    expect(canAssignRole("developer", "admin")).toBe(true);
    expect(canAssignRole("developer", "superadmin")).toBe(true);
    expect(canAssignRole("superadmin", "admin")).toBe(true);
    // Özünə bərabər və ya yuxarı — olmaz.
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("superadmin", "developer")).toBe(false);
    expect(canAssignRole("admin", "superadmin")).toBe(false);
  });

  it("naməlum rollarda çökmür", () => {
    expect(() => canAssignRole(undefined, "admin")).not.toThrow();
    expect(canAssignRole(undefined, "admin")).toBe(false);
    expect(canAssignRole("developer", "yoxdur")).toBe(false);
  });
});

describe("requireSection icra olunur", () => {
  it("developer hər bölməyə buraxılır", () => {
    expect(run(requireSection("users"), { user: { role: "developer", permissions: [] } })).toBe("next");
  });

  it("icazəli bölmə açıqdır", () => {
    expect(run(requireSection("leads"), { user: { role: "admin", permissions: ["leads"] } })).toBe("next");
  });

  it("icazəsiz bölmə 403 verir", () => {
    expect(run(requireSection("users"), { user: { role: "admin", permissions: ["leads"] } })).toBe(403);
  });

  it("boş icazə = məhdudiyyət yoxdur (köhnə hesablar)", () => {
    expect(run(requireSection("users"), { user: { role: "admin", permissions: [] } })).toBe("next");
  });

  it("istifadəçi yoxdursa 401", () => {
    expect(run(requireSection("users"), {})).toBe(401);
  });
});

describe("requireRole icra olunur", () => {
  it("icazəli rolu buraxır, digərini 403 edir", () => {
    const only = requireRole(["developer"]);
    expect(run(only, { user: { role: "developer" } })).toBe("next");
    expect(run(only, { user: { role: "superadmin" } })).toBe(403);
    expect(run(only, {})).toBe(401);
  });
});

describe("cacheHeaders icra olunur", () => {
  it("çökmədən next çağırır", () => {
    expect(run(cacheHeaders, { method: "GET", path: "/api/home" })).toBe("next");
    expect(run(cacheHeaders, { method: "POST", path: "/api/admin/users" })).toBe("next");
  });
});
