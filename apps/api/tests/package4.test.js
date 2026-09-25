import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { Course, CourseCategory, Branch, Teacher, Destination, BlogPost, Page, Quiz, Project, Testimonial } from "#models";
import { config } from "#config";
import { getUrls } from "../controllers/seoController.js";

/**
 * AUDİT — dördüncü paket (API): #30 sitemap, #51 kurs səhifəsi, #56 şablon adları.
 */

afterEach(() => vi.restoreAllMocks());

describe("#30 sitemap URL siyahısı", () => {
  const rows = (...items) => ({ select: () => Promise.resolve(items) });
  const run = async () => {
    const d = (s) => new Date(`2026-09-${s}T10:00:00Z`);
    vi.spyOn(Course, "findPublic").mockReturnValue(rows({ slug: "ielts", updatedAt: d("10") }));
    vi.spyOn(CourseCategory, "findPublic").mockReturnValue(rows({ slug: "dil-kurslari", updatedAt: d("02") }));
    vi.spyOn(Branch, "findPublic").mockReturnValue(rows({ slug: "genclik", updatedAt: d("05") }));
    vi.spyOn(Teacher, "findPublic").mockReturnValue(rows());
    vi.spyOn(Destination, "findPublic").mockReturnValue(rows({ slug: "almaniya", updatedAt: d("12") }));
    vi.spyOn(BlogPost, "findPublished").mockReturnValue(rows({ slug: "yazi", updatedAt: d("08") }));
    const page = vi.spyOn(Page, "findPublic").mockReturnValue(rows());
    vi.spyOn(Quiz, "findPublic").mockReturnValue(rows());
    vi.spyOn(Project, "findPublic").mockReturnValue(rows({ slug: "layihe", updatedAt: d("01") }));
    // Rəylərin öz ünvanı yoxdur — yalnız /telebelerimiz-in lastmod-u üçün.
    vi.spyOn(Testimonial, "findPublic").mockReturnValue(rows({ updatedAt: d("07") }));
    const res = { json: vi.fn() };
    getUrls({}, res, (e) => { throw e; });
    // asyncHandler promise-i qaytarmır — cavabı gözləyirik.
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled());
    return { urls: res.json.mock.calls[0][0].data.urls, page };
  };

  it("404 verən ünvanlar yoxdur, layihələr və haqqımızda var", async () => {
    const { urls, page } = await run();
    const paths = urls.map((u) => u.path);
    expect(paths).toContain("/filiallar");
    // Filialın öz səhifəsi ARTIQ VAR. Bu yoxlama əvvəl əksini tələb edirdi:
    // marşrut yox idi, ünvan 404 verirdi, ona görə sitemap-a düşməməli idi.
    // İndi səhifə var — sitemap-da olmalıdır (bax apps/web .../filiallar/[slug]).
    expect(paths).toContain("/filiallar/genclik");
    expect(paths).toContain("/layiheler/layihe");
    expect(paths).toContain("/haqqimizda");
    // Page yalnız marşrutu olan sənədlər üçün oxunur.
    expect(page).toHaveBeenCalledWith({ slug: { $in: ["haqqimizda"] } });
  });

  it("siyahı səhifələrinin lastmod-u içindəki ən son dəyişiklikdir, «indi» yazılmır", async () => {
    const { urls } = await run();
    const of = (p) => urls.find((u) => u.path === p);
    expect(of("/").lastmod.toISOString()).toBe("2026-09-12T10:00:00.000Z");
    expect(of("/kurslar").lastmod.toISOString()).toBe("2026-09-10T10:00:00.000Z");
    // Mənbəsi boş olan siyahı səhifəsi lastmod-suz qalır — «indi» yazılmır.
    expect(of("/muellimler").lastmod).toBeUndefined();
    // Əlaqə səhifəsinin məzmunu filiallardır, rəy səhifəsininki rəylər:
    // əvvəl ikisi də lastmod-suz gedirdi, halbuki mənbələri var.
    expect(of("/elaqe").lastmod.toISOString()).toBe("2026-09-05T10:00:00.000Z");
    expect(of("/telebelerimiz").lastmod.toISOString()).toBe("2026-09-07T10:00:00.000Z");
  });
});

describe("#51 kurs səhifəsi", () => {
  it("əlaqəli kurslar yüngül kart kimi çəkilir, qrafik sorğusu yoxdur", () => {
    const src = fs.readFileSync("controllers/public/courseController.js", "utf8");
    const fn = src.slice(src.indexOf("const getCourseBySlug"));
    // Qrafik sistemi çıxarıldı — müəllimlər kursun özündən gəlir.
    expect(fn).not.toMatch(/CourseGroup/);
    expect(src).toMatch(/populate\(live\("teachers", "fullName slug title photo color"\)\)/);
    expect(fn).toMatch(/\.limit\(6\)\s*\n\s*\.select\(CARD_EXCLUDE\)/);
  });
});

describe("#56 şablon qalıqları", () => {
  it("ad və defoltlar British Academy-yə aiddir", () => {
    expect(config.siteName).toBe("British Academy");
    expect(JSON.parse(fs.readFileSync("package.json", "utf8")).name).toBe("britishacademy-server");
    expect(fs.readFileSync("config/config.js", "utf8")).not.toMatch(/localhost:5173"\),/);
  });
});
