import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ADMIN_RESOURCES, ORDERABLE } from "@/lib/adminResources";

/**
 * SİYAHIDA YUXARI/AŞAĞI OXLARI.
 *
 * Oxlar `order` sahəsini yazır. Onların DOĞRU olması iki şərtdən asılıdır:
 *
 *  1. Serverin həmin resurs üçün sıralaması `order` ilə BAŞLAMALIDIR — əks
 *     halda siyahı başqa sahəyə görə düzülür və ox basmaq heç nəyi dəyişmir
 *     (istifadəçi üçün səssiz uğursuzluq).
 *  2. Ekranda TAM siyahı olmalıdır — axtarış/filtr aktivdirsə görünən hissəyə
 *     ardıcıl nömrə yazmaq görünməyən elementlərin sırasını pozardı.
 */

const PAGE = "src/app/(protected)/dashboard/resurslar/[resource]/page.js";
const page = fs.readFileSync(PAGE, "utf8");

describe("sıralanabilən bölmələr siyahısı", () => {
  it("hamısı tanınan resursdur", () => {
    const unknown = [...ORDERABLE].filter((r) => !ADMIN_RESOURCES[r]);
    expect(unknown, `ADMIN_RESOURCES-də yoxdur: ${unknown.join(", ")}`).toEqual([]);
    expect(ORDERABLE.size).toBeGreaterThanOrEqual(13);
  });

  it("sırası olmayan bölmələr kənardadır", () => {
    // Bunlar tarixə / kliklərə / başlanğıc tarixinə görə düzülür; `menu-items`
    // isə əvvəlcə `location`-a görə — qonşu dəyişmək qrupları pozardı.
    for (const r of ["menu-items", "blog-posts", "leads", "media", "course-groups"]) {
      expect(ORDERABLE.has(r), `${r} sıralanabilən sayılmamalıdır`).toBe(false);
    }
  });

  /**
   * Serverin reyestri ilə çarpaz yoxlama. `apps/web` ayrıca repo kimi də
   * klonlana bilir — o halda qonşu qovluq yoxdur və yoxlama ötürülür.
   */
  it("serverin `order`-ə görə sıralaması ilə üst-üstə düşür", () => {
    const REG = "../api/controllers/resourceRegistry.js";
    if (!fs.existsSync(REG)) return; // tək-repo klonu
    const reg = fs.readFileSync(REG, "utf8");

    // `  "ad": {` … `sort: { … }` cütlərini çıxar
    const sorts = {};
    for (const m of reg.matchAll(/^ {2}"?([a-z-]+)"?:\s*\{([\s\S]*?)^ {2}\},/gm)) {
      const s = m[2].match(/sort:\s*\{\s*([a-zA-Z]+)/);
      if (s) sorts[m[1]] = s[1];
    }
    expect(Object.keys(sorts).length, "reyestr oxunmadı — format dəyişib?").toBeGreaterThan(10);

    const wrong = [...ORDERABLE].filter((r) => sorts[r] && sorts[r] !== "order");
    expect(wrong, `server bunları \`order\`-ə görə düzmür: ${wrong.join(", ")}`).toEqual([]);

    const missing = [...ORDERABLE].filter((r) => !sorts[r]);
    expect(missing, `serverin reyestrində yoxdur: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("siyahı səhifəsinin sıralama davranışı", () => {
  it("axtarış/filtr aktivdirsə oxlar gizlənir", () => {
    expect(page).toMatch(/const filtersOn = Boolean\(search\) \|\| Object\.keys\(activeFilters\)\.length > 0/);
    expect(page).toMatch(/const canReorder = ORDERABLE\.has\(resource\) && !filtersOn/);
  });

  it("səbəb istifadəçiyə yazılır", () => {
    // Oxların səbəbsiz yoxa çıxması «xarab oldu» kimi oxunur.
    expect(page).toMatch(/Sıra oxları yalnız/);
  });

  it("səhifə sürüşməsi göndərilir", () => {
    // Onsuz 2-ci səhifə 0-dan nömrələnib 1-ci ilə toqquşardı.
    expect(page).toMatch(/start:\s*\(page - 1\) \* PAGE_SIZE/);
    // Sorğu limiti ilə sürüşmə EYNİ sabitdən gəlməlidir.
    expect(page).toMatch(/limit:\s*PAGE_SIZE/);
  });

  it("sərhəd oxları sönülüdür", () => {
    expect(page).toMatch(/disabled=\{i === 0 \|\| isFetching\}/);
    expect(page).toMatch(/disabled=\{i === items\.length - 1 \|\| isFetching\}/);
  });
});
