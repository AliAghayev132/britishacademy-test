import { describe, it, expect } from "vitest";
import { isNewer, installedVersion } from "#services";
import { WA_LOG_TYPES } from "#models";

/**
 * Kitabxana versiyasının müqayisəsi.
 *
 * NİYƏ VACİBDİR: WhatsApp Web protokolu tez-tez dəyişir və `whatsapp-web.js`
 * geri qalanda bağlantı SƏBƏBSİZ görünən şəkildə sınır — QR skan olunur,
 * sonra «qoşulma gecikdi» yazır. Panel indi yeni versiyanı özü xəbər verir,
 * ona görə müqayisə səhv olsa bildiriş ya heç çıxmaz, ya da yalandan çıxar.
 *
 * Semver kitabxanası ƏLAVƏ EDİLMƏDİ — yalnız bu müqayisə lazımdır.
 */
describe("isNewer", () => {
  it("əsas müqayisə", () => {
    expect(isNewer("1.34.8", "1.34.7")).toBe(true);
    expect(isNewer("1.34.7", "1.34.8")).toBe(false);
    expect(isNewer("1.34.7", "1.34.7")).toBe(false);
  });

  it("hissələr AYRICA ədəd kimi müqayisə olunur", () => {
    // Sətir müqayisəsi olsaydı "1.9.0" > "1.10.0" çıxardı.
    expect(isNewer("1.10.0", "1.9.0")).toBe(true);
    expect(isNewer("1.9.0", "1.10.0")).toBe(false);
    expect(isNewer("2.0.0", "1.99.99")).toBe(true);
  });

  it("çatışmayan hissə sıfır sayılır", () => {
    expect(isNewer("1.35", "1.34.9")).toBe(true);
    expect(isNewer("1.34", "1.34.0")).toBe(false);
  });

  it("ön-buraxılış hissəsi atılır", () => {
    // «1.35.0-beta.1» dərc olunubsa, quraşdırılmış 1.34.7-dən yenidir.
    expect(isNewer("1.35.0-beta.1", "1.34.7")).toBe(true);
    expect(isNewer("v1.34.8", "1.34.7")).toBe(true);
  });

  it("boş və zibil dəyərdə çökmür", () => {
    expect(isNewer("", "1.0.0")).toBe(false);
    expect(isNewer(null, undefined)).toBe(false);
    expect(isNewer("abc", "1.0.0")).toBe(false);
  });
});

describe("installedVersion", () => {
  it("quraşdırılmış paketin versiyasını oxuyur", () => {
    const v = installedVersion();
    // Paket bu repoda quraşdırılıb; formatı yoxlanılır.
    expect(v).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("jurnal hadisə növləri", () => {
  it("panelin tanıdığı növlərlə üst-üstə düşür", () => {
    // Paneldəki TYPES obyekti bu siyahı ilə eynidir (LogsTab.jsx).
    for (const t of ["init", "qr", "auth", "ready", "state", "disconnect",
      "health", "send", "ack", "session", "version", "error"]) {
      expect(WA_LOG_TYPES).toContain(t);
    }
  });

  it("təkrarlanan növ yoxdur", () => {
    expect(new Set(WA_LOG_TYPES).size).toBe(WA_LOG_TYPES.length);
  });
});
