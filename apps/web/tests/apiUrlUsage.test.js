import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * `API_URL` ADI İKİ FƏRQLİ DƏYƏRİ DAŞIYIR — bu test onları qarışdırmağın
 * qarşısını alır.
 *
 *   1. `@/lib/variables`-dən gələn `API_URL` — HƏMİŞƏ `/api` ilə bitir
 *      (normallaşdırılıb). Yol ona `/media/…`, `/auth/…` kimi əlavə olunur.
 *   2. Bəzi fayllar öz yerli sabitini qurur:
 *      `const API_URL = process.env.NEXT_PUBLIC_API_URL || "…"` — bu, XAM
 *      hostdur, ona görə yol `/api/…` ilə başlamalıdır.
 *
 * KONKRET NASAZLIQ: `FileUpload` və `MediaPicker` birinci mənbədən idxal edib
 * ikinci qaydanı işlədirdi. Ünvan `/api/api/media/upload-image` çıxırdı, server
 * 404 «Endpoint not found» qaytarırdı, panel isə yalnız «yüklənmədi» yazırdı —
 * səbəbi görmək üçün brauzerin şəbəkə panelinə baxmaq lazım gəlirdi.
 *
 * Yükləmələr RTK Query-dən KEÇMİR (o, gedişat faizini verə bilmir), yəni baza
 * sorğusunun prefiks məntiqi bura tətbiq olunmur — ünvan əl ilə qurulur.
 */

const ROOT = "src";

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
};

/**
 * Şərhlər skandan çıxarılır: onlar qəsdən nasazlığın NÜMUNƏSİNİ göstərir
 * (məsələn «ünvan /api/api/… çıxırdı»), yəni skan onları da tapıb yalançı
 * xəbərdarlıq verərdi.
 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const files = walk(ROOT).map((f) => {
  const raw = fs.readFileSync(f, "utf8");
  return { f: f.replace(/\\/g, "/"), raw, src: stripComments(raw) };
});

/** `@/lib/variables`-dən `API_URL` idxal edən fayllar. */
const fromVariables = files.filter(({ raw }) =>
  /import\s*\{[^}]*\bAPI_URL\b[^}]*\}\s*from\s*['"]@\/lib\/variables['"]/.test(raw),
);

/** Öz yerli xam sabitini quranlar. */
const localConst = files.filter(({ raw }) => /const\s+API_URL\s*=/.test(raw));

describe("API_URL istifadəsi", () => {
  it("hər iki qrup tapılır", () => {
    expect(fromVariables.length).toBeGreaterThan(0);
    expect(localConst.length).toBeGreaterThan(0);
  });

  it("idxal edilən API_URL-ə `/api` İKİNCİ DƏFƏ əlavə olunmur", () => {
    // NİYƏ SƏTİR SABİTLƏRİNƏ BAXILIR, birbaşa `${API_URL}/api` naxışına yox:
    // sınıq kodda iki yarı FƏRQLİ SƏTİRLƏRDƏ idi —
    //     const endpoint = "/api/media/upload-image";
    //     uploadWithProgress(`${API_URL}${endpoint}`, …)
    // birləşdirilmiş naxış heç vaxt uyğun gəlmirdi. Baq da buna görə gözə
    // görünmürdü: hər iki sətir ayrılıqda düzgün görünür.
    const bad = [];
    const LITERAL = /["'`](\/api\/[^"'`]*)["'`]/g;
    const DIRECT = /\$\{API_URL\}\/api\b/;
    for (const { f, src } of fromVariables) {
      for (const m of src.matchAll(LITERAL)) bad.push(`${f}: "${m[1]}"`);
      if (DIRECT.test(src)) bad.push(`${f}: API_URL-dən sonra /api`);
    }
    expect(bad, `ikiqat /api:\n${bad.join("\n")}`).toEqual([]);
  });

  it("yerli xam sabitə `/api` ƏLAVƏ OLUNUR", () => {
    // Əks səhv: xam hosta `/api` yazmamaq — sorğu kök yola gedərdi.
    const bad = [];
    for (const { f, src } of localConst) {
      // `lib/variables.js` istisnadır — normallaşdırmanı o özü qurur.
      if (f.endsWith("lib/variables.js")) continue;
      for (const m of src.matchAll(/\$\{API_URL\}(\/[a-z-]+)/g)) {
        if (m[1] !== "/api") bad.push(`${f}: \${API_URL}${m[1]}`);
      }
    }
    expect(bad, `xam hosta /api yazılmayıb:\n${bad.join("\n")}`).toEqual([]);
  });

  it("yükləmə ünvanları düzgündür", () => {
    for (const name of ["FileUpload.jsx", "MediaPicker.jsx"]) {
      const hit = files.find(({ f }) => f.endsWith(name));
      expect(hit, `${name} tapılmadı`).toBeTruthy();
      expect(hit.src, `${name}: yükləmə ünvanı yoxdur`).toMatch(/media\/upload-/);
      expect(hit.src, `${name}: yol /api ilə başlayır`).not.toMatch(/["'`]\/api\/media\/upload/);
    }
  });
});
