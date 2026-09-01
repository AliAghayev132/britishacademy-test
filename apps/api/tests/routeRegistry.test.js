import { describe, it, expect } from "vitest";
import { PublicRouter, AdminRouter } from "#routes";
import { RESOURCES } from "../controllers/resourceRegistry.js";

/**
 * Marşrutların HƏQİQƏTƏN qeydiyyatdan keçməsi.
 *
 * Kontroller yazmaq və onu router-ə bağlamağı unutmaq ən asan səhvdir: kod
 * lint-dən keçir, testlər yaşıl qalır, amma endpoint canlıda «Endpoint not
 * found» verir. Bu, layihədə artıq bir dəfə baş verib.
 *
 * Express router-in daxili `stack`-i oxunur — heç bir şəbəkə və ya baza
 * bağlantısı lazım deyil.
 */

/** Router-dəki bütün (metod, yol) cütləri. */
function routesOf(router) {
  const out = [];
  for (const layer of router.stack || []) {
    if (!layer.route) continue;
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods || {});
    for (const m of methods) out.push(`${m.toUpperCase()} ${path}`);
  }
  return out;
}

const PUBLIC = routesOf(PublicRouter);
const ADMIN = routesOf(AdminRouter);

describe("public marşrutları", () => {
  it.each([
    "POST /track/:code",
    "GET /quizzes",
    "GET /quizzes/:slug",
    "POST /quizzes/:slug/submit",
  ])("%s qeydiyyatdadır", (route) => {
    expect(PUBLIC).toContain(route);
  });
});

describe("admin marşrutları", () => {
  it.each([
    "GET /links/:id/stats",
    "DELETE /links/:id/clicks",
    "POST /dev/migrate-slugs",
    "POST /dev/import-quizzes",
  ])("%s qeydiyyatdadır", (route) => {
    expect(ADMIN).toContain(route);
  });

  it("sabit marşrutlar generic /:resource-dan ƏVVƏL gəlir", () => {
    // Express ilk uyğun gələni götürür: /links/:id/stats generic
    // GET /:resource/:id-dən sonra qeydiyyatdan keçsəydi, «links» resurs adı
    // kimi oxunar və 404 «Unknown resource» qaytarılardı.
    const genericIdx = ADMIN.indexOf("GET /:resource/:id");
    expect(genericIdx).toBeGreaterThan(-1);

    for (const fixed of ["GET /links/:id/stats", "GET /stats/content"]) {
      expect(ADMIN.indexOf(fixed), `${fixed} generic matcher-dən sonradır`).toBeLessThan(genericIdx);
    }
  });
});

describe("resurs reyestri", () => {
  it.each(["short-links", "quizzes"])("«%s» reyestrdədir", (name) => {
    expect(RESOURCES[name]).toBeTruthy();
    expect(RESOURCES[name].model).toBeTruthy();
  });

  it("hər resursun modeli və axtarış sahələri var", () => {
    for (const [name, entry] of Object.entries(RESOURCES)) {
      expect(entry.model, `${name}: model yoxdur`).toBeTruthy();
      expect(Array.isArray(entry.search), `${name}: search massiv deyil`).toBe(true);
    }
  });
});
