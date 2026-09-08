import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { diffDocs } from "../services/LogService.js";
import { AuditLog } from "../models/auditLog.model.js";

/**
 * ƏMƏLİYYAT JURNALI.
 *
 * Əvvəl qeyd yalnız bir cümlə idi — «courses yeniləndi: IELTS». Yəni:
 *   • hansı sahənin dəyişdiyi bilinmirdi;
 *   • əvvəlki dəyər itirdi;
 *   • GİRİŞLƏR ümumiyyətlə yazılmırdı;
 *   • müraciətin statusunu dəyişmək heç bir iz qoymurdu.
 */

describe("diffDocs — sahə-sahə fərq", () => {
  it("dəyişən sahəni tapır, dəyişməyəni buraxır", () => {
    const d = diffDocs({ a: 1, b: 2 }, { a: 1, b: 3 });
    expect(d).toEqual([{ field: "b", from: "2", to: "3" }]);
  });

  it("YALNIZ `after`-dəki açarlara baxır", () => {
    // PUT sənədin BİR HİSSƏSİNİ göndərir. Tam sənədlə tutuşdursaq
    // göndərilməyən hər sahə «silindi» kimi görünərdi.
    const d = diffDocs({ a: 1, toxunulmayan: "x" }, { a: 2 });
    expect(d.map((x) => x.field)).toEqual(["a"]);
  });

  it("sirləri MASKALAYIR", () => {
    // Parol dəyişikliyi qeydə düşməlidir (kim dəyişdi — vacibdir), amma
    // DƏYƏRİ yox: əks halda audit jurnalının özü sirlər siyahısı olardı.
    for (const f of ["password", "pass", "smtpPass", "apiKey", "api_key", "token", "secret"]) {
      const d = diffDocs({ [f]: "köhnə-sirr" }, { [f]: "yeni-sirr" });
      expect(d, `${f} maskalanmayıb`).toEqual([{ field: f, from: "•••", to: "•••" }]);
      expect(JSON.stringify(d)).not.toContain("sirr");
    }
  });

  it("səs-küy sahələri atılır", () => {
    // Hər yazıda dəyişir, məlumat vermir — jurnalı doldurardılar.
    const d = diffDocs(
      { updatedAt: 1, __v: 0, name: "a" },
      { updatedAt: 2, __v: 1, name: "b" },
    );
    expect(d.map((x) => x.field)).toEqual(["name"]);
  });

  it("çoxdilli sahə AZ variantı ilə göstərilir", () => {
    // Onsuz jurnalda «[object Object]» görünürdü.
    const d = diffDocs(
      { title: { az: "Köhnə", en: "Old" } },
      { title: { az: "Yeni", en: "New" } },
    );
    expect(d[0]).toEqual({ field: "title", from: "Köhnə", to: "Yeni" });
  });

  it("boolean, boş və massiv dəyərlər oxunaqlıdır", () => {
    expect(diffDocs({ x: false }, { x: true })[0]).toEqual({ field: "x", from: "xeyr", to: "bəli" });
    expect(diffDocs({ x: "" }, { x: "var" })[0].from).toBe("—");
    expect(diffDocs({ x: [] }, { x: [1, 2, 3] })[0]).toEqual({ field: "x", from: "boş", to: "3 element" });
  });

  it("uzun dəyər qısaldılır", () => {
    const long = "a".repeat(500);
    const d = diffDocs({ x: "" }, { x: long });
    expect(d[0].to.length).toBeLessThan(200);
    expect(d[0].to.endsWith("…")).toBe(true);
  });

  it("boş/naməlum girişdə çökmür", () => {
    expect(diffDocs()).toEqual([]);
    expect(diffDocs(null, null)).toEqual([]);
    expect(diffDocs(undefined, { a: 1 })[0].field).toBe("a");
  });
});

describe("jurnal sxemi", () => {
  it("dəyişikliklər, nəticə və sorğu məlumatı saxlanılır", () => {
    const d = new AuditLog({
      action: "update", resource: "courses",
      changes: [{ field: "price", from: "100", to: "120" }],
      status: "fail", reason: "Şifrə yanlışdır",
      ip: "1.2.3.4", userAgent: "Chrome", method: "PUT", path: "/api/admin/courses/1",
    });
    expect(d.validateSync()).toBeUndefined();
    expect(d.changes[0].to).toBe("120");
    expect(d.status).toBe("fail");
  });

  it("nəticə yalnız ok/fail ola bilər", () => {
    const d = new AuditLog({ action: "login", status: "bəlkə" });
    expect(d.validateSync()).toBeDefined();
  });

  it("istifadəçi üzrə indeks var", () => {
    // Panelin «istifadəçi» süzgəci bu indeksdən istifadə edir.
    const idx = AuditLog.schema.indexes().map(([k]) => Object.keys(k).join(","));
    expect(idx).toContain("actor.id,createdAt");
  });
});

describe("qeyd edilən nöqtələr", () => {
  const auth = fs.readFileSync("controllers/authController.js", "utf8");
  const lead = fs.readFileSync("controllers/leadController.js", "utf8");
  const admin = fs.readFileSync("controllers/adminController.js", "utf8");
  const users = fs.readFileSync("controllers/userAdminController.js", "utf8");

  it("giriş və çıxış yazılır", () => {
    expect(auth).toMatch(/action: "login"/);
    expect(auth).toMatch(/action: "logout"/);
  });

  it("UĞURSUZ giriş cəhdləri də yazılır", () => {
    // Yalnız uğurlu girişləri saxlamaq təhlükəsizlik jurnalını mənasız edir —
    // hesabın seçilib-seçilmədiyi məhz uğursuz cəhdlərdən görünür.
    const fails = auth.match(/status: "fail"/g) || [];
    expect(fails.length, "üç hal olmalıdır: naməlum e-poçt, səhv parol, deaktiv hesab")
      .toBeGreaterThanOrEqual(3);
    expect(auth).toMatch(/Belə istifadəçi yoxdur/);
    expect(auth).toMatch(/Şifrə yanlışdır/);
  });

  it("naməlum e-poçtda cəhd edilən ünvan qeyd olunur", () => {
    // `req.user` yoxdur — aktyor açıq şəkildə ötürülməlidir, yoxsa qeyd
    // «Sistem» adına düşər və kimin cəhd etdiyi itər.
    expect(auth).toMatch(/actor: \{ email:/);
  });

  it("MÜRACİƏTƏ toxunan hər şey yazılır", () => {
    // Status endpoint-i generic CRUD-dan yan keçir — əvvəl iz qoymurdu.
    expect(lead).toMatch(/action: "status"/);
    expect(lead).toMatch(/resource: "leads"/);
    expect(lead).toMatch(/changes: diffDocs\(/);
  });

  it("resurs dəyişikliyində sahə-sahə fərq var", () => {
    expect(admin).toMatch(/const before = item\.toObject\(\)/);
    expect(admin).toMatch(/changes,/);
  });

  it("silinən elementin ADI qeyd olunur", () => {
    // Əvvəl yalnız id qalırdı, yəni «nə silindi» sualına cavab yox idi.
    expect(admin).toMatch(/const doomed = await entry\.model\.findById/);
  });

  it("rol və icazə dəyişikliyi izlənilir", () => {
    expect(users).toMatch(/changes = diffDocs\(before,/);
    expect(users).toMatch(/permissions: user\.permissions/);
  });
});

describe("süzgəclər", () => {
  const users = fs.readFileSync("controllers/userAdminController.js", "utf8");

  it("istifadəçi, nəticə və tarix aralığı üzrə süzülür", () => {
    expect(users).toMatch(/filter\["actor\.id"\] = req\.query\.actor/);
    expect(users).toMatch(/filter\.status = req\.query\.status/);
    expect(users).toMatch(/req\.query\.from/);
    expect(users).toMatch(/req\.query\.to/);
  });

  it("`to` günün SONUNA qədər götürülür", () => {
    // Onsuz «1-dən 5-ə qədər» seçəndə 5-i günü ümumiyyətlə düşmürdü.
    expect(users).toMatch(/setHours\(23, 59, 59, 999\)/);
  });

  it("aktyor id-si ObjectId kimi yoxlanılır", () => {
    // Yararsız dəyər Mongo-da CastError verərdi (500).
    expect(users).toMatch(/isObjectId\(req\.query\.actor\)/);
  });

  it("dəyişən sahə də axtarışa düşür", () => {
    expect(users).toMatch(/"changes\.field"/);
  });

  it("süzgəc siyahıları jurnalın ÖZÜNDƏN gəlir", () => {
    // Sabit siyahı olsaydı silinmiş istifadəçi seçimdən düşərdi (halbuki
    // onun izi jurnalda qalır), yeni əməliyyat növü isə görünməzdi.
    expect(users).toMatch(/const logFilters = asyncHandler/);
    expect(users).toMatch(/AuditLog\.distinct\("action"\)/);
  });
});
