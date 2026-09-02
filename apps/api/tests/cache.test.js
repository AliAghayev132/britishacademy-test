import { describe, it, expect } from "vitest";
import { cacheHeaders } from "#middlewares";

// Keş başlıqlarının səhv qoyulması iki cür zərər verir:
//   • public cavab keşlənmirsə — lazımsız yük
//   • ŞƏXSİ cavab keşlənirsə — bir istifadəçinin datası başqasına gedə bilər
// İkincisi təhlükəsizlik məsələsidir, ona görə ayrıca yoxlanılır.

/**
 * Sorğunu MOUNT EDİLMİŞ şəkildə qurur — istehsalatdakı kimi.
 *
 * Middleware `app.use("/api", cacheHeaders)` ilə quraşdırılıb, ona görə Express
 * `req.path`-dan «/api» hissəsini KƏSİR: /api/admin/leads sorğusunda
 * `req.path` «/admin/leads», `req.baseUrl` isə «/api» olur.
 *
 * Əvvəlki test bunu simulyasiya etmirdi — `req.path`-a tam yolu verirdi və
 * yaşıl qalırdı, halbuki istehsalatda bütün admin cavabları keşlənirdi.
 */
const run = (method, fullPath) => {
  const headers = {};
  let called = false;
  const req = fullPath.startsWith("/api")
    ? { method, baseUrl: "/api", path: fullPath.slice(4) || "/" }
    : { method, baseUrl: "", path: fullPath };
  cacheHeaders(req, { set: (k, v) => (headers[k] = v) }, () => (called = true));
  return { headers, called };
};

describe("cacheHeaders", () => {
  it("public GET-ləri keşləyir", () => {
    for (const p of ["/api/home", "/api/site", "/api/courses", "/api/branches"]) {
      const { headers } = run("GET", p);
      expect(headers["Cache-Control"]).toMatch(/^public, max-age=\d+/);
      expect(headers["Cache-Control"]).toContain("stale-while-revalidate");
    }
  });

  it("public cavablarda Vary qoyur — dil qarışmasın", () => {
    const { headers } = run("GET", "/api/home");
    expect(headers.Vary).toContain("x-lang");
  });

  it("admin cavablarını HEÇ VAXT keşləmir", () => {
    for (const p of ["/api/admin/stats", "/api/admin/leads", "/api/admin/whatsapp/status"]) {
      expect(run("GET", p).headers["Cache-Control"]).toBe("no-store");
    }
  });

  it("auth və ai cavablarını keşləmir", () => {
    expect(run("GET", "/api/auth/me").headers["Cache-Control"]).toBe("no-store");
    expect(run("POST", "/api/auth/login").headers["Cache-Control"]).toBe("no-store");
    expect(run("GET", "/api/ai/translate").headers["Cache-Control"]).toBe("no-store");
  });

  it("yazma əməliyyatlarını keşləmir", () => {
    for (const m of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(run(m, "/api/leads").headers["Cache-Control"]).toBe("no-store");
    }
  });

  it("HEAD sorğusunu GET kimi sayır", () => {
    expect(run("HEAD", "/api/home").headers["Cache-Control"]).toMatch(/^public/);
  });

  it("həmişə next() çağırır", () => {
    expect(run("GET", "/api/home").called).toBe(true);
    expect(run("POST", "/api/admin/x").called).toBe(true);
  });
});

/**
 * İSTEHSALAT NASAZLIĞI — reqressiya.
 *
 * NEVER_CACHE naxışları «/api/admin» gözləyirdi, mount edilmiş middleware isə
 * «/admin/...» alırdı. Uyğunluq heç vaxt baş vermirdi və BÜTÜN admin cavabları
 * `public, max-age=60, stale-while-revalidate=300` alırdı.
 *
 * İki nəticəsi vardı:
 *   1) Admin paneldə yadda saxlayandan sonra siyahı 60 saniyə köhnə qalırdı.
 *      RTK Query invalidasiya edib yenidən sorğu göndərirdi, brauzer isə
 *      keşdən köhnə cavabı qaytarırdı — istifadəçi «yadda saxlanmır, refresh
 *      atmalı oluram» deyirdi. Bütün formalarda təkrarlanırdı.
 *   2) Müraciətlər (telefon nömrələri), istifadəçi siyahısı və tənzimləmələr
 *      `public` işarələnirdi — ara keşlər onları saxlaya bilərdi.
 */
describe("mount edilmiş yol (req.path «/api» olmadan gəlir)", () => {
  it("admin yolları mount edilmiş formada da keşlənmir", () => {
    const headers = {};
    // Express-in verdiyi məhz bu formadır.
    cacheHeaders(
      { method: "GET", baseUrl: "/api", path: "/admin/leads" },
      { set: (k, v) => (headers[k] = v) },
      () => {},
    );
    expect(headers["Cache-Control"]).toBe("no-store");
  });

  it("auth və ai üçün də eyni", () => {
    for (const p of ["/auth/me", "/ai/process"]) {
      const headers = {};
      cacheHeaders(
        { method: "GET", baseUrl: "/api", path: p },
        { set: (k, v) => (headers[k] = v) },
        () => {},
      );
      expect(headers["Cache-Control"], p).toBe("no-store");
    }
  });

  it("public yollar mount edilmiş formada keşlənməyə davam edir", () => {
    const headers = {};
    cacheHeaders(
      { method: "GET", baseUrl: "/api", path: "/home" },
      { set: (k, v) => (headers[k] = v) },
      () => {},
    );
    expect(headers["Cache-Control"]).toMatch(/^public, max-age=\d+/);
  });
});
