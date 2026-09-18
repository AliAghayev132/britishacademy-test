import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { Course, Lead } from "#models";
import { view } from "../controllers/eventController.js";
import { stripSystemFields } from "../controllers/admin/crudController.js";
import { leadInReach } from "../services/LeadAccessService.js";

/**
 * FAZA 2 — auditin məlumat itkisi və düzgünlük tapıntıları (API).
 * #9 müraciət əhatəsi yazmada, #11 kurs qrupları silinirdi, #13 baxış
 * sayğacı, #19 spam, #20 sistem sahələri.
 */

afterEach(() => vi.restoreAllMocks());
const read = (f) => fs.readFileSync(f, "utf8");
/** Qovluqdakı bütün .js fayllarının mətni (bölünmüş modullar üçün). */
const readDir = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => read(`${dir}/${f}`)).join("\n");

describe("#13 baxış sayğacı brauzerdən", () => {
  const call = async (body, ua = "Mozilla/5.0 Chrome/120") => {
    const res = { status: vi.fn().mockReturnThis(), end: vi.fn() };
    await view({ body, headers: { "user-agent": ua } }, res, (e) => { throw e; });
    return res;
  };

  it("real baxış sayılır", async () => {
    const upd = vi.spyOn(Course, "updateOne").mockResolvedValue({});
    const res = await call({ type: "course", slug: "ielts-kurslari" });
    expect(upd).toHaveBeenCalledWith({ slug: "ielts-kurslari", isDeleted: false }, { $inc: { views: 1 } });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("bot, naməlum tip və yararsız slug sayılmır", async () => {
    const upd = vi.spyOn(Course, "updateOne").mockResolvedValue({});
    await call({ type: "course", slug: "ielts" }, "Googlebot/2.1");
    await call({ type: "users", slug: "x" });
    await call({ type: "course", slug: { $ne: "" } });
    expect(upd).not.toHaveBeenCalled();
  });

  it("keşlənən GET-lərdə sayğac qalmayıb", () => {
    expect(readDir("controllers/public")).not.toMatch(/\$inc: \{ views: 1 \}/);
    expect(read("routes/publicRoutes.js")).toMatch(/PublicRouter\.post\("\/views", eventController\.view\)/);
  });
});

describe("#15 siyahılar ağır sahələri qaytarmır", () => {
  it("kart sorğuları mətn, FAQ və SEO-nu çıxarır, detal sorğuları toxunulmur", () => {
    const src = readDir("controllers/public");
    expect(src).toMatch(/const CARD_EXCLUDE = "-contentHtml -content -faq -seo";/);
    for (const q of [
      /Course\.findPublic\(filter\)\.populate\("category"\)\.select\(CARD_EXCLUDE\)/,
      /Destination\.findPublic\(filter\)\.select\(CARD_EXCLUDE\)/,
      /Project\.findPublic\(\)\.select\(CARD_EXCLUDE\)/,
      /Course\.findFeatured\(HOME_COURSE_COUNT\)\.populate\("category"\)\.select\(CARD_EXCLUDE\)/,
      /Destination\.findPublic\(\{ isFeatured: true \}\)\.limit\(8\)\.select\(CARD_EXCLUDE\)/,
    ]) {
      expect(src).toMatch(q);
    }
  });
});

describe("#20 sistem sahələri", () => {
  it("klient isDeleted, sayğac və müəllif sahələrini yaza bilmir", () => {
    const out = stripSystemFields({ title: "Kurs", isDeleted: false, views: 999, clicks: 5, createdBy: "x", handledBy: "y", _id: "z" });
    expect(out).toEqual({ title: "Kurs" });
  });

  it("silinmiş sənəd redaktə olunmur, yaradan serverdə qoyulur", () => {
    const src = read("controllers/admin/crudController.js");
    expect(src).toMatch(/if \(!item \|\| item\.isDeleted\)/);
    expect(src).toMatch(/data\.createdBy = req\.user\?\._id/);
  });
});

describe("#9 müraciət əhatəsi", () => {
  const manager = { role: "editor", permissions: ["leads"], allowedBranches: ["b1"] };

  it("filial meneceri yalnız öz filialının müraciətinə çatır", () => {
    expect(leadInReach(manager, { interest: "İngilis dili", branch: "b1" })).toBe(true);
    expect(leadInReach(manager, { interest: "İngilis dili", branch: { _id: "b2" } })).toBe(false);
    // Filialsız müraciət kənarda qalmır — əks halda cavabsız qalardı.
    expect(leadInReach(manager, { interest: "İngilis dili" })).toBe(true);
  });

  it("bölmə icazəsi olmayan müraciətə çatmır", () => {
    expect(leadInReach(manager, { interest: "Xaricdə təhsil" })).toBe(false);
    expect(leadInReach(manager, null)).toBe(false);
  });

  it("yeniləmə, silmə, status, dashboard və toplu göndərmə eyni yoxlamadan keçir", () => {
    const ac = read("controllers/admin/crudController.js") + read("controllers/admin/dashboardController.js");
    expect(ac).toMatch(/resource === "leads" && !leadInReach\(req\.user, item\)/);
    expect(ac).toMatch(/lead && !leadInReach\(req\.user, lead\)/);
    expect(ac).toMatch(/applyLeadScope\(leadFilter, req, "leads"\)/);
    expect(read("controllers/leadController.js")).toMatch(/if \(!leadInReach\(req\.user, lead\)\)/);
    expect(read("controllers/bulkController.js")).toMatch(/applyLeadScope\(filter, req, "leads"\)/);
    // Köhnə /whatsapp/bulk silinib (audit #42) — toplu göndəriş yalnız bulkController-dədir.
    expect(read("controllers/whatsappController.js")).not.toMatch(/const bulk = asyncHandler/);
  });
});

describe("dərs qrafiki sistemi qalmadı", () => {
  // Qrafik (kurs + filial + müəllim + saat) çıxarıldı. Təsadüfən geri
  // qayıtmasın: nə model, nə marşrut, nə də sihirbazda qrup məntiqi olmamalıdır.
  it("model, marşrut və sihirbazda qrup izi yoxdur", () => {
    expect(fs.existsSync("models/courseGroup.model.js")).toBe(false);
    expect(read("routes/publicRoutes.js")).not.toMatch(/schedule/);
    expect(read("controllers/courseComposer.js")).not.toMatch(/CourseGroup|planGroupSync|schedule/);
    expect(read("models/index.js")).not.toMatch(/CourseGroup/);
  });

  it("əlaqə tək yerdədir: kursda müəllimlər", () => {
    expect(read("models/course.model.js")).toMatch(/teachers: \[\{ type: Schema\.Types\.ObjectId, ref: "Teacher" \}\]/);
    expect(read("models/teacher.model.js")).not.toMatch(/assignments|courses: \[/);
  });
});

describe("#19 spam qorunması", () => {
  const validate = async (doc) => {
    try { await doc.validate(); return null; } catch (e) { return e; }
  };

  it("müraciət sahələrinin uzunluğu məhduddur", async () => {
    expect((await validate(new Lead({ name: "x".repeat(121), phone: "050" })))?.errors?.name).toBeDefined();
    expect((await validate(new Lead({ name: "Ali", phone: "1".repeat(41) })))?.errors?.phone).toBeDefined();
    expect((await validate(new Lead({ name: "Ali", phone: "050", message: "m".repeat(3001) })))?.errors?.message).toBeDefined();
    expect(await validate(new Lead({ name: "Ali", phone: "+994 50 000 00 00", message: "Salam" }))).toBeNull();
  });

  it("honeypot, kiçik body limiti və ayrı limit", () => {
    expect(read("controllers/leadController.js")).toMatch(/if \(req\.body\?\.website\)/);
    expect(read("app/middleware.js")).toMatch(/express\.json\(\{ limit: "32kb" \}\)/);
    expect(read("routes/publicRoutes.js")).toMatch(/post\("\/leads", leadRateLimiter/);
  });
});
