import { describe, it, expect } from "vitest";
import { cacheHeaders } from "#middlewares";

// Keş başlıqlarının səhv qoyulması iki cür zərər verir:
//   • public cavab keşlənmirsə — lazımsız yük
//   • ŞƏXSİ cavab keşlənirsə — bir istifadəçinin datası başqasına gedə bilər
// İkincisi təhlükəsizlik məsələsidir, ona görə ayrıca yoxlanılır.

const run = (method, path) => {
  const headers = {};
  let called = false;
  cacheHeaders({ method, path }, { set: (k, v) => (headers[k] = v) }, () => (called = true));
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
