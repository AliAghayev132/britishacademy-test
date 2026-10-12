import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";

/**
 * VİDEO YÜKLƏMƏ — canlı gedişat və ölçü tavanı.
 *
 * ── NƏ DÜZƏLDİ ──
 *  1. Faiz yuvarlaqlaşdırılmırdı: düymədə «Yüklənir… 37.48292682926829%»
 *     yazılırdı.
 *  2. Bütün baytlar gedəndən sonra server faylı diskə yazır, amma panel
 *     bunu bildirmirdi — çubuq 100%-də «donmuş» görünürdü. İndi nəqliyyat
 *     qatı `phase: "processing"` xəbər verir.
 *  3. Gedən yükləməni dayandırmaq mümkün deyildi (böyük video dəqiqələrlə
 *     gedir). İndi `AbortSignal` dəstəklənir.
 *  4. Ölçü tavanı üç yerdə ayrı-ayrı yazılmışdı; indi `lib/uploadLimits.js`
 *     ortaq mənbədir (Cloudflare 100 MB tavanına bağlı).
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

// ── Saxta XMLHttpRequest ──
let last;
class FakeXHR {
  constructor() {
    this.upload = {};
    this.status = 200;
    this.responseText = JSON.stringify({ success: true, data: { url: "/uploads/videos/a.mp4" } });
    last = this;
  }
  open() {}
  send() {}
  abort() { this.onabort?.(); }
}

beforeEach(() => {
  last = null;
  globalThis.window = globalThis;
  globalThis.XMLHttpRequest = FakeXHR;
});
afterEach(() => {
  delete globalThis.XMLHttpRequest;
  vi.restoreAllMocks();
});

describe("uploadWithProgress", () => {
  it("bayt sayğacını ötürür — panel «15.7 / 28.0 MB» yaza bilsin", async () => {
    const { uploadWithProgress } = await import("@/lib/uploadWithProgress");
    const seen = [];
    const done = uploadWithProgress("/x", new FormData(), (pct, info) => seen.push([pct, info]));
    last.upload.onprogress({ lengthComputable: true, loaded: 50, total: 200 });
    last.onload();
    await done;
    expect(seen[0][0]).toBe(25);
    expect(seen[0][1]).toEqual({ loaded: 50, total: 200 });
  });

  it("baytlar qurtaranda «processing» mərhələsi bildirilir", async () => {
    const { uploadWithProgress } = await import("@/lib/uploadWithProgress");
    const seen = [];
    const done = uploadWithProgress("/x", new FormData(), (pct, info) => seen.push([pct, info]));
    // Əvvəl bu hadisə yox idi: çubuq 100%-də qalır, istifadəçi donma sanırdı.
    last.upload.onload();
    last.onload();
    await done;
    expect(seen.at(-1)).toEqual([100, { phase: "processing" }]);
  });

  it("AbortSignal ilə ləğv edilir", async () => {
    const { uploadWithProgress } = await import("@/lib/uploadWithProgress");
    const c = new AbortController();
    const done = uploadWithProgress("/x", new FormData(), undefined, { signal: c.signal });
    c.abort();
    await expect(done).rejects.toThrow(/ləğv edildi/i);
  });
});

describe("yükləmə tavanı tək mənbədədir", () => {
  it("video 100 MB — Cloudflare tavanı ilə eyni", async () => {
    const { UPLOAD_MAX_MB, assertUploadSize } = await import("@/lib/uploadLimits");
    expect(UPLOAD_MAX_MB.video).toBe(100);
    expect(() => assertUploadSize({ size: 110 * 1024 * 1024 }, "video")).toThrow(/110\.0 MB.*100 MB/);
    expect(() => assertUploadSize({ size: 10 * 1024 * 1024 }, "video")).not.toThrow();
  });

  it("hər üç yükləmə yolu ortaq tavanı işlədir", () => {
    expect(read("src/components/ui/FileUpload.jsx")).toMatch(/assertUploadSize\(file, isVideo \? "video" : "image"\)/);
    const ed = read("src/lib/uploadDocumentForEditor.js");
    expect(ed.split("assertUploadSize(").length - 1).toBe(3);
    // Redaktorun öz sabiti deyil, ortaq mənbə.
    expect(read("src/components/editor/parts/VideoMenu.jsx")).toMatch(/const MAX_MB = UPLOAD_MAX_MB\.video;/);
  });

  it("faiz yuvarlaqlaşdırılır", () => {
    const fu = read("src/components/ui/FileUpload.jsx");
    expect(fu).toMatch(/Yüklənir… \$\{Math\.round\(pct\)\}%/);
    expect(fu).not.toMatch(/Yüklənir… \$\{pct\}%/);
  });

  it("gedişat panelində ləğv düyməsi və «serverdə yazılır» var", () => {
    const fu = read("src/components/ui/FileUpload.jsx");
    expect(fu).toMatch(/Serverdə yazılır/);
    expect(fu).toMatch(/onClick=\{cancel\}/);
  });
});
