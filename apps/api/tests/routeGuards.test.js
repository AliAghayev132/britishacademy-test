import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * MARŞRUT QORUMALARININ STRUKTUR YOXLAMASI.
 *
 * Auditdə tapılan nasazlıq: `/admin/courses/full` üç marşrutu generic
 * `/:resource` matcher-indən ƏVVƏL qeydiyyatdan keçirdi, yəni oradakı bölmə
 * yoxlamasından yan keçirdi. Nəticədə yalnız «müraciətlər» icazəsi olan admin
 * kursu oxuya, YARADA və DƏYİŞDİRƏ bilirdi (POST 201, PUT 200 ilə təsdiqləndi).
 *
 * Bu test mənbə mətnini oxuyur, çünki problem RUNTIME davranışında deyil,
 * marşrutun necə QEYDİYYATDAN KEÇDİYİNDƏDİR. Yeni sabit marşrut əlavə edən
 * adam ya qoruma yazmalıdır, ya da onu aşağıdakı siyahıya salıb səbəbini
 * göstərməlidir.
 */

const admin = fs.readFileSync("routes/adminRoutes.js", "utf8");

/**
 * Qəsdən qorumasız marşrutlar — hər biri üçün səbəb.
 *
 * Bunlar router səviyyəsindəki `authenticate + requireRole(adminRoles)`
 * yoxlamasından onsuz da keçir; əlavə BÖLMƏ yoxlaması yoxdur.
 */
const OPEN_BY_DESIGN = {
  "/stats": "idarə paneli hər admin üçün açıqdır; müraciət məlumatı controller-də süzülür",
  "/settings": "üç bölmə oxuyur (Tənzimləmələr, Ana səhifə, QR); yazma sahə səviyyəsində yoxlanılır",
  "/lookups": "ad/id cütləri — hamısı public saytda görünür; ölkə/filial əhatəsi tətbiq olunur",
  "/leads/:id/status": "müraciətin növünə görə controller-də yoxlanılır (leads / leads-abroad)",
};

/** Generic CRUD marşrutları — qoruma `adminController`-dədir (denySection). */
const GENERIC = /^\/:resource/;

describe("admin marşrutlarının qorunması", () => {
  const lines = admin
    .split("\n")
    .map((l, i) => ({ n: i + 1, l }))
    .filter(({ l }) => /^AdminRouter\.(get|post|put|patch|delete)\(/.test(l.trim()));

  it("marşrutlar tapılır", () => {
    expect(lines.length).toBeGreaterThan(30);
  });

  // Prefiks qorumaları: `AdminRouter.use("/whatsapp", requireSection(...))`
  // altındakı bütün marşrutlar sətirdə ayrıca qoruma yazmadan qorunur.
  const guardedPrefixes = [...admin.matchAll(/AdminRouter\.use\("([^"]+)",\s*require(?:Section|Role)\(/g)]
    .map((m) => m[1]);

  it("prefiks qorumaları tapılır", () => {
    expect(guardedPrefixes).toContain("/whatsapp");
    expect(guardedPrefixes).toContain("/bulk");
  });

  it("hər sabit marşrutun qoruması var", () => {
    const unguarded = [];
    for (const { n, l } of lines) {
      const path = /\("([^"]+)"/.exec(l)?.[1] || "";
      if (GENERIC.test(path)) continue;
      if (path in OPEN_BY_DESIGN) continue;
      if (guardedPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) continue;
      // devOnly = requireRole(["developer"]), userAdmin = requireRole([superadmin, developer])
      if (/requireSection\(|devOnly|userAdmin|requireRole\(/.test(l)) continue;
      unguarded.push(`sətir ${n}: ${path}`);
    }
    expect(unguarded, `qorumasız marşrut:\n${unguarded.join("\n")}`).toEqual([]);
  });

  it("kurs kompozitoru «courses» bölməsi tələb edir", () => {
    // REGRESSİYA: bu üç sətir generic matcher-dən əvvəldədir və əvvəl
    // tamamilə qorumasız idi.
    for (const p of ["/courses/full/:id", "/courses/full"]) {
      const rows = lines.filter(({ l }) => l.includes(`"${p}"`));
      expect(rows.length, `${p} marşrutu tapılmadı`).toBeGreaterThan(0);
      for (const { l } of rows) {
        expect(l, `${p} qorunmayıb`).toMatch(/requireSection\("courses"\)/);
      }
    }
  });

  it("WhatsApp və toplu göndəriş bölmə ilə bağlanıb", () => {
    expect(admin).toMatch(/AdminRouter\.use\("\/whatsapp", requireSection\("whatsapp"\)\)/);
    expect(admin).toMatch(/AdminRouter\.use\("\/bulk", requireSection\("whatsapp"\)\)/);
  });

  it("loglar öz bölməsini tələb edir", () => {
    expect(admin).toMatch(/AdminRouter\.get\("\/logs", requireSection\("logs"\)/);
  });
});

describe("admin xaricindəki router-lər", () => {
  /**
   * Bunlarda ƏVVƏL yalnız `authenticate` vardı — yəni panel rolu olmayan
   * istənilən autentifikasiya olunmuş hesab qalereyaya fayl yükləyə və
   * ödənişli AI sorğusu göndərə bilərdi.
   */
  for (const [file, why] of [
    ["routes/mediaRoutes.js", "fayl yükləmə"],
    ["routes/aiRoutes.js", "ödənişli AI sorğuları"],
    ["routes/postRoutes.js", "məzmun yazma"],
  ]) {
    it(`${file} rol yoxlaması edir (${why})`, () => {
      const src = fs.readFileSync(file, "utf8");
      expect(src, `${file}-də requireRole(adminRoles) yoxdur`).toMatch(/requireRole\(adminRoles\)/);
    });
  }

  it("public marşrutlarda admin qoruması axtarılmır", () => {
    // publicRoutes qəsdən açıqdır — bu test onu əhatə etmir.
    expect(fs.existsSync("routes/publicRoutes.js")).toBe(true);
  });
});
