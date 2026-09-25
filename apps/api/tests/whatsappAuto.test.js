import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import { WhatsAppService } from "#services";
import { QR_MAX_ATTEMPTS } from "../services/whatsapp/constants.js";

/**
 * WhatsApp inteqrasiyasının AÇARI.
 *
 * ── TAPILAN NASAZLIQ ──
 * Skan gözlənilərkən whatsapp-web.js təxminən hər 20 saniyədə YENİ QR yayır.
 * Heç bir hədd yox idi: kimsə skan etməsə Chromium saatlarla açıq qalır,
 * jurnal «QR kodu yaradıldı (#N)» sətirləri ilə dolur və paneldəki şəkil
 * dayanmadan dəyişirdi. İnteqrasiyanı tamamilə söndürməyin yolu da yox idi.
 *
 * ── HƏLL ──
 *  1. `SiteSetting.whatsapp.autoConnect` — paneldəki açar. Söndürüləndə nə
 *     avtomatik bərpa, nə əl ilə qoşulma, nə də sağlamlıq taymeri işləyir.
 *  2. `QR_MAX_ATTEMPTS` — bu qədər cəhddən sonra gözləmə öz-özünə dayanır.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

afterEach(() => {
  WhatsAppService.autoConnect = true;
  WhatsAppService.qrStopped = false;
  WhatsAppService.lastError = null;
  vi.restoreAllMocks();
});

describe("inteqrasiya açarı", () => {
  it("söndürüləndə `init` qoşulmağa cəhd belə etmir", async () => {
    const load = vi.spyOn(WhatsAppService, "_load");
    WhatsAppService.autoConnect = false;
    await WhatsAppService.init({});
    // `_load`-a çatsaydı Chromium yolu açılardı — guard ondan ƏVVƏLdir.
    expect(load).not.toHaveBeenCalled();
    expect(WhatsAppService.lastError).toMatch(/söndürülüb/i);
  });

  it("söndürüləndə saxlanmış sessiya da avtomatik bərpa olunmur", async () => {
    const load = vi.spyOn(WhatsAppService, "_load");
    WhatsAppService.autoConnect = false;
    await WhatsAppService.resumeIfSession();
    expect(load).not.toHaveBeenCalled();
  });

  it("söndürüləndə sağlamlıq taymeri qurulmur", () => {
    WhatsAppService.stopHealthWatch();
    WhatsAppService.autoConnect = false;
    WhatsAppService.startHealthWatch();
    expect(WhatsAppService._healthTimer).toBeFalsy();
  });

  it("açar SiteSetting-də saxlanılır və server açılanda oxunur", () => {
    expect(read("models/siteSetting.model.js")).toMatch(/whatsapp: \{[^}]*autoConnect: \{ type: Boolean, default: true \}/s);
    expect(read("app/startup.js")).toMatch(/WhatsAppService\.autoConnect = settings\?\.whatsapp\?\.autoConnect !== false;/);
    // Panel açarı yalnız admin dəyişə bilər.
    expect(read("controllers/whatsappController.js")).toMatch(/const setAuto = asyncHandler/);
    expect(read("routes/adminRoutes.js")).toMatch(/AdminRouter\.post\("\/whatsapp\/auto"/);
  });
});

describe("QR gözləmə həddi", () => {
  it("hədd var və status onu göstərir", () => {
    expect(QR_MAX_ATTEMPTS).toBeGreaterThan(0);
    expect(read("services/whatsapp/events.js")).toMatch(/if \(svc\._qrCount >= QR_MAX_ATTEMPTS\) await svc\.stopQrWait\(\);/);
    expect(read("services/whatsapp/status.js")).toMatch(/qrStopped: Boolean\(svc\.qrStopped\)/);
  });

  it("`stopQrWait` sessiyanı SİLMİR — yalnız gözləməni dayandırır", () => {
    const src = read("services/WhatsAppService.js");
    const fn = src.slice(src.indexOf("static async stopQrWait"), src.indexOf("static async setAutoConnect"));
    expect(fn).toMatch(/this\.qrStopped = true;/);
    expect(fn).toMatch(/_destroyClient/);
    // `clearSession` çağırılsaydı istifadəçi növbəti dəfə məcburi QR görərdi.
    expect(fn).not.toMatch(/clearSession/);
  });

  it("hər yeni qoşulma cəhdində sayğac sıfırlanır", () => {
    expect(read("services/WhatsAppService.js")).toMatch(/this\._qrCount = 0;/);
  });
});
