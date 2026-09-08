import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * SƏHİFƏ META MƏLUMATI.
 *
 * ── TAPILAN NASAZLIQ ──
 * `metaFromApi` ASYNC-dır (içəridə sayt tənzimləmələrini gözləyir). İki
 * səhifə onun nəticəsini `await` etmədən YAYIRDI:
 *
 *     const meta = metaFromApi(...);      // Promise
 *     return { ...meta, openGraph: {...} } // Promise-in yayılması = {}
 *
 * Nəticə: bloq yazıları və testlər öz başlığını, təsvirini və kanonik
 * ünvanını TAMAMİLƏ itirirdi — hamısı saytın defolt metası ilə çıxırdı.
 * Səhifədə hər şey düzgün görünürdü, ona görə nasazlıq gözlə tutulmurdu;
 * yalnız HTML-in `<head>` hissəsinə baxanda üzə çıxdı.
 *
 * Bu, məhz SEO üçün yazılan məzmunun dəyərini sıfırlayırdı.
 *
 * ── İKİNCİ NASAZLIQ ──
 * Test səhifəsi `metaFromApi`-nin HAZIR nəticəsini yenidən `buildMetadata`-ya
 * verirdi. Artıq formalaşmış başlıq obyekti xam arqument kimi işlənirdi və
 * başlıq «[object Object]» çıxırdı.
 */

const APP = "src/app";

/** Bütün `page.js` fayllarını topla. */
function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name === "page.js" || e.name === "layout.js") out.push(p);
  }
  return out;
}

const files = pages(APP).map((f) => ({
  file: f.replace(/\\/g, "/"),
  src: fs.readFileSync(f, "utf8"),
}));

const usesMeta = files.filter((f) => /metaFromApi\(/.test(f.src));

describe("metadata qurulması", () => {
  it("`metaFromApi` işlədən səhifələr tapılır", () => {
    expect(usesMeta.length, "heç bir səhifə tapılmadı — ad dəyişib?").toBeGreaterThanOrEqual(5);
  });

  it("nəticəsi YAYILANDA mütləq `await` edilir", () => {
    // `return metaFromApi(...)` düzgündür — Next qaytarılan Promise-i özü
    // gözləyir. Problem yalnız nəticə YAYILANDA (`...meta`) yaranır.
    const bad = [];
    for (const { file, src } of usesMeta) {
      // dəyişənə mənimsətmə: `const meta = metaFromApi(` — await olmalıdır
      for (const m of src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(await\s+)?metaFromApi\(/g)) {
        const [, name, awaited] = m;
        // dəyişən sonradan yayılırsa await şərtdir
        if (new RegExp(`\\.\\.\\.${name}\\b`).test(src) && !awaited) {
          bad.push(`${file}: \`...${name}\` await edilməyib`);
        }
      }
      // birbaşa yayma: `...metaFromApi(` — həmişə await olmalıdır
      if (/\.\.\.\s*metaFromApi\(/.test(src)) {
        bad.push(`${file}: \`...metaFromApi(...)\` await edilməyib`);
      }
    }
    expect(bad, `Promise yayılır (metadata boş qalır):\n${bad.join("\n")}`).toEqual([]);
  });

  it("`metaFromApi` nəticəsi yenidən `buildMetadata`-ya verilmir", () => {
    // İkiqat emal: hazır metadata obyektini xam arqument kimi işlətmək
    // başlığı «[object Object]» edir.
    const bad = usesMeta
      .filter(({ src }) => /buildMetadata\(\s*\{[\s\S]{0,200}?metaFromApi\(/.test(src))
      .map(({ file }) => file);
    expect(bad, `ikiqat emal: ${bad.join(", ")}`).toEqual([]);
  });

  it("hər səhifə öz yolunu (`path`) ötürür", () => {
    // `path` olmasa kanonik ünvan səhv qurulur və axtarış sistemi səhifəni
    // saytın kökü ilə eyniləşdirə bilər.
    const bad = [];
    for (const { file, src } of usesMeta) {
      for (const m of src.matchAll(/metaFromApi\([\s\S]{0,400}?\n\s*\}\)/g)) {
        if (!/path:/.test(m[0])) bad.push(file);
      }
    }
    expect([...new Set(bad)], `\`path\` ötürülmür: ${[...new Set(bad)].join(", ")}`).toEqual([]);
  });
});
