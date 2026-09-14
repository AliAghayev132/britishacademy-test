import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { Course, CourseCategory, Branch, Teacher, Destination, BlogPost, Page, Quiz, Project } from "#models";
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
    const res = { json: vi.fn() };
    getUrls({}, res, (e) => { throw e; });
    // asyncHandler promise-i qaytarmır — cavabı gözləyirik.
    await vi.waitFor(() => expect(res.json).toHaveBeenCalled());
    return { urls: res.json.mock.calls[0][0].data.urls, page };
  };

  it("404 verən ünvanlar yoxdur, layihələr və haqqımızda var", async () => {
    const { urls, page } = await run();
    const paths = urls.map((u) => u.path);
    expect(paths.some((p) => p.startsWith("/filiallar/"))).toBe(false);
    expect(paths).toContain("/filiallar");
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
    expect(of("/muellimler").lastmod).toBeUndefined();
    expect(of("/elaqe").lastmod).toBeUndefined();
  });
});

describe("#51 kurs səhifəsi", () => {
  it("qruplar və əlaqəli kurslar paralel, kartlar yüngül", () => {
    const src = fs.readFileSync("controllers/public/courseController.js", "utf8");
    const fn = src.slice(src.indexOf("const getCourseBySlug"), src.indexOf("/* ---------------- Schedule"));
    expect(fn).toMatch(/const \[groups, related\] = await Promise\.all\(/);
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
