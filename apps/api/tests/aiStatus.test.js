import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CTRL = fs.readFileSync(path.join(ROOT, "controllers/aiController.js"), "utf8");
const ROUTES = fs.readFileSync(path.join(ROOT, "routes/aiRoutes.js"), "utf8");

/**
 * AI status endpoint-i.
 *
 * Admin panel bunu AI düymələrini söndürmək üçün işlədir. Əvvəl düymələr
 * həmişə aktiv görünürdü: istifadəçi basırdı, 503 gəlirdi və səbəbi yalnız
 * səhv mesajından öyrənirdi.
 */
describe("GET /api/ai/status", () => {
  it("marşrut qeydiyyatdadır və auth tələb edir", () => {
    expect(ROUTES).toMatch(/AIRouter\.get\("\/status",\s*authenticate/);
  });

  it("kontroller status ixrac edir", () => {
    expect(CTRL).toMatch(/export \{[^}]*\bstatus\b/);
  });

  it("API açarı CAVABDA QAYTARILMIR", () => {
    // Endpoint auth tələb edir, amma açarı cavaba qoymaq yenə də səhvdir:
    // brauzer konsolunda və şəbəkə jurnalında görünərdi.
    //
    // Yalnız `res.json({...})` bloku yoxlanılır — handler-in içində
    // `Boolean(cfg.apiKey)` açarın MÖVCUDLUĞUNU yoxlayır və qanunidir.
    const block = CTRL.slice(CTRL.indexOf("const status = asyncHandler"));
    const payload = block.slice(block.indexOf("res.json("), block.indexOf("});"));
    expect(payload).not.toMatch(/apiKey/);
    // Cavabda yalnız bunlar olmalıdır.
    expect(payload).toMatch(/enabled/);
    expect(payload).toMatch(/model/);
  });

  it("söndürülü halda səbəb mətni qaytarılır", () => {
    const block = CTRL.slice(CTRL.indexOf("const status = asyncHandler"));
    expect(block).toMatch(/reason/);
    expect(block).toMatch(/Tənzimləmələr/);
  });
});
