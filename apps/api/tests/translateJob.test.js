import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import { TranslateJob } from "#services";

/**
 * AI TOPLU TƏRCÜMƏ — «yarıda saxlayır» nasazlığı.
 *
 * ── SƏBƏB (ölçülüb) ──
 * Endpoint işin BİTMƏSİNİ gözləyirdi. İş hər sənəd üçün 1-2 AI çağırışı
 * edir: təkcə Partner modeli 30 sənəd / 60 çağırış = 35 saniyə, bütün
 * modellər isə dəqiqələrlə. Sorğu Cloudflare-in 100 saniyə sərt limitinə
 * ilişirdi — panel xəta görür, iş arxada davam edirdi. Üstəlik `errors`
 * siyahısı cavabla birlikdə itdiyi üçün səbəb heç vaxt görünmürdü:
 * canlıda 85 sahə tərcüməsiz qalmışdı (Partner modelinin HAMISI — 60 sahə).
 *
 * Birbaşa serverdə (HTTP-siz) işlədiləndə eyni model 0 xəta ilə tam
 * tərcümə olundu — yəni AI və servis məntiqi düzgündür, problem yalnız
 * sorğunun kəsilməsində idi.
 *
 * ── HƏLL ──
 * İş arxa fonda gedir; endpoint dərhal qayıdır (ölçüldü: 10 ms), panel
 * gedişatı `/dev/translate-all/status` ilə oxuyur.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

afterEach(() => {
  TranslateJob.running = false;
  TranslateJob.finishedAt = null;
  TranslateJob.errors = [];
});

describe("TranslateJob", () => {
  it("vəziyyət obyekti panelin gözlədiyi sahələri daşıyır", () => {
    const s = TranslateJob.getState();
    for (const k of ["running", "model", "docIndex", "docTotal", "fields", "report", "errors", "message"]) {
      expect(s, k).toHaveProperty(k);
    }
  });

  it("eyni anda iki qaçışa icazə vermir", () => {
    // İkiqat qaçış eyni sənədlər üçün İKİQAT AI xərci deməkdir.
    const first = TranslateJob.start({ model: "__YoxduBeləModel__" });
    const second = TranslateJob.start({ model: "__YoxduBeləModel__" });
    expect(first.started).toBe(true);
    expect(second.started).toBe(false);
  });

  it("başlayan kimi `running` qalxır — cavab işi gözləmir", () => {
    TranslateJob.start({ model: "__YoxduBeləModel__" });
    // Sinxron yoxlanılır: `start` işi AWAIT ETMİR.
    expect(TranslateJob.running).toBe(true);
  });

  it("xətalar yalnız 50 ədədə qədər verilir", () => {
    TranslateJob.errors = Array.from({ length: 120 }, (_, i) => `xəta ${i}`);
    expect(TranslateJob.getState().errors).toHaveLength(50);
  });
});

describe("endpoint arxa fon rejimindədir", () => {
  const ctrl = read("controllers/dev/systemTools.js");

  it("cavab işin bitməsini gözləmir", () => {
    expect(ctrl).toMatch(/TranslateJob\.start\(/);
    // `await autoTranslate(...)` qayıtsa nasazlıq da qayıdır.
    expect(ctrl).not.toMatch(/await autoTranslate\(/);
  });

  it("gedişat üçün status endpoint-i var", () => {
    expect(ctrl).toMatch(/const getAutoTranslateStatus = developerOnly/);
    expect(read("routes/adminRoutes.js")).toMatch(/AdminRouter\.get\("\/dev\/translate-all\/status"/);
  });
});
