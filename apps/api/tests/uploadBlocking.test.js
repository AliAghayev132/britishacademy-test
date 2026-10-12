import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { config } from "#config";

/**
 * VİDEO YÜKLƏMƏ — «sistem donur» nasazlığı.
 *
 * ── İKİ AYRI SƏBƏB ──
 *
 * 1) Yol boyu limitlər uyğun deyildi. API 250 MB vəd edirdi, nginx isə
 *    `client_max_body_size 12m` ilə kəsirdi. Ölçülmüş davranış (canlı):
 *      11 MB → tətbiqə çatır
 *      13 MB → 502 Bad Gateway   ← sərhəddə bağlanan upstream
 *      20 MB → 413
 *    Brauzer gövdəni göndərməyə davam etdiyi üçün panel yalnız donmuş
 *    gedişat çubuğu göstərirdi. İndi API = nginx = Cloudflare = 100 MB.
 *    (100 MB Cloudflare-in pulsuz planının sərt tavanıdır.)
 *
 * 2) `saveMediaWithOriginal` «original» nüsxəsini `fs.copyFileSync` ilə
 *    götürürdü. API tək Node prosesidir: 100 MB-lıq faylın kopyalanması
 *    boyu HADİSƏ DÖNGƏSİ bloklanır və bu müddətdə bütün sayt — admin
 *    paneli, server tərəfli render — cavab vermir.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

describe("yükləmə hadisə döngəsini bloklamır", () => {
  const src = read("services/FileService.js");

  it("original nüsxəsi ASENXRON kopyalanır", () => {
    expect(src).toMatch(/await fs\.promises\.copyFile\(/);
    // Sinxron variant qayıtsa 100 MB-lıq yükləmə bütün API-ni dondurar.
    expect(src).not.toMatch(/fs\.copyFileSync\(/);
  });

  it("faylın özü diskə asenxron köçürülür", () => {
    // express-fileupload `mv` — temp fayldan rename/stream, sinxron deyil.
    expect(src).toMatch(/await file\.mv\(filePath\)/);
  });
});

describe("limitlər yol boyu uyğundur", () => {
  it("video limiti 100 MB-dır (Cloudflare tavanı)", () => {
    // Defolt 250 idi: panel 250 MB vəd edir, sorğu isə sərhəddə kəsilirdi.
    expect(config.upload.maxVideoSize).toBe(100 * 1024 * 1024);
  });

  it("limitin nəyə bağlı olduğu koddan oxunur", () => {
    const cfg = read("config/config.js");
    expect(cfg).toMatch(/Cloudflare/);
    expect(cfg).toMatch(/client_max_body_size/);
  });
});
