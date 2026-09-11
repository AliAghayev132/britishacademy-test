import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { COURSE_PAGES } from "../data/pageContent/courses.mjs";
import { DESTINATION_PAGES } from "../data/pageContent/destinations.mjs";
import { importPageContent, isEmptyText } from "../services/PageContentImportService.js";
import { Course, Destination } from "#models";

/**
 * KURS VƏ ÖLKƏ SƏHİFƏLƏRİNİN MƏZMUNU.
 *
 * Auditdə: 27 kurs səhifəsindən 21-i, 12 ölkə səhifəsinin hamısı mətnsiz,
 * heç birində SEO yox. Bu dəst həmin boşluğu doldurur. Testin əsas işləri:
 *   • hər canlı slug-un məzmunu var (yeni kurs əlavə olunanda xəbər verir);
 *   • sahə adları SXEMƏ uyğundur — Mongoose tanımadığı sahəni səssizcə atır
 *     (bloq dəstində elə bu səbəbdən SEO itmişdi);
 *   • import admin-in yazdığı mətni SİLMİR.
 */

const COURSES = [
  "ingilis-dili-kurslari", "biznes-ingilis-dili-kursu", "huquqsunaslar-ingilis-dili-kursu",
  "otel-turizm-ingilis-dili-kursu", "alman-dili-kursu", "beynelxalq-sertifikatli-alman-dili-kursu",
  "rus-dili-kursu", "ispan-dili-kursu", "italyan-dili-kursu", "fransiz-dili-kursu",
  "conversation-club", "workshop", "ielts-kurslari", "toefl", "oet", "toeic", "sat-kurslari",
  "duolingo", "toles", "tefl-kurslari", "ms-office", "pesekar-excel-kursu",
  "muhasibatliq-1c-kursu", "hr-karguzarliq-kursu", "usaq-ingilis-dili", "usaq-rus-dili", "usaq-mentiq",
];
const DESTINATIONS = [
  "almaniya", "turkiye", "ingiltere", "kanada", "polsa", "latviya", "macaristan",
  "litva", "rusiya", "gurcustan", "estoniya", "teqaud-proqramlari",
];
const ALL = [...COURSE_PAGES, ...DESTINATION_PAGES];
const htmlOf = (p) => p.contentHtml?.az || "";

describe("əhatə", () => {
  it("27 kursun hər biri var, artıq/təkrar yoxdur", () => {
    const slugs = COURSE_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size, "təkrar slug").toBe(slugs.length);
    expect([...slugs].sort()).toEqual([...COURSES].sort());
  });

  it("12 ölkənin hər biri var, artıq/təkrar yoxdur", () => {
    const slugs = DESTINATION_PAGES.map((p) => p.slug);
    expect(new Set(slugs).size, "təkrar slug").toBe(slugs.length);
    expect([...slugs].sort()).toEqual([...DESTINATIONS].sort());
  });

  it("hər səhifənin SEO-su var", () => {
    for (const p of ALL) {
      expect(p.seo?.metaTitle?.az, `${p.slug}: metaTitle`).toBeTruthy();
      expect(p.seo?.metaDescription?.az, `${p.slug}: metaDescription`).toBeTruthy();
      expect(p.seo?.keywords?.az, `${p.slug}: keywords`).toBeTruthy();
    }
  });

  it("hər ölkənin mətni, faktları və FAQ-ı var", () => {
    for (const p of DESTINATION_PAGES) {
      expect(htmlOf(p).length, `${p.slug}: mətn`).toBeGreaterThan(500);
      expect(p.facts?.length, `${p.slug}: facts`).toBeGreaterThanOrEqual(3);
      expect(p.faq?.length, `${p.slug}: faq`).toBeGreaterThanOrEqual(3);
    }
  });

  it("hər kursun ya mətni data-da var, ya da canlı səhifədə artıq var", () => {
    // Bu kursların canlı səhifəsində mətn artıq yazılıb — dəst onu saxlayır.
    const liveHasBody = new Set(["ingilis-dili-kurslari", "rus-dili-kursu", "ielts-kurslari", "duolingo", "ms-office"]);
    const missing = COURSE_PAGES.filter((p) => !liveHasBody.has(p.slug) && !htmlOf(p)).map((p) => p.slug);
    expect(missing, `mətnsiz kurs: ${missing.join(", ")}`).toEqual([]);
    for (const p of COURSE_PAGES) expect(p.info?.length, `${p.slug}: info`).toBeGreaterThanOrEqual(2);
  });
});

describe("sxemə uyğunluq — səssiz itki olmasın", () => {
  const check = (Model, p, fields) => {
    const doc = new Model({ slug: p.slug, ...p });
    for (const f of fields) {
      const src = f.split(".").reduce((o, k) => o?.[k], p);
      if (src === undefined) continue;
      const got = doc.get(f);
      if (Array.isArray(src)) {
        expect(got?.length, `${p.slug}: ${f} sxemə düşmədi`).toBe(src.length);
        // Siyahı elementlərinin sahələri də düşməlidir (label/value, question/answer).
        const first = typeof got[0]?.toObject === "function" ? got[0].toObject() : got[0];
        for (const k of Object.keys(src[0])) expect(first?.[k]?.az, `${p.slug}: ${f}[0].${k}`).toBe(src[0][k].az);
      } else {
        expect(got?.az, `${p.slug}: ${f} sxemə düşmədi`).toBe(src.az);
      }
    }
  };

  it("kurs sahələri Course sxeminə düşür", () => {
    const fields = ["lead", "excerpt", "contentHtml", "info", "faq", "seo.metaTitle", "seo.metaDescription", "seo.keywords"];
    for (const p of COURSE_PAGES) check(Course, p, fields);
  });

  it("ölkə sahələri Destination sxeminə düşür", () => {
    const fields = ["lead", "contentHtml", "facts", "faq", "seo.metaTitle", "seo.metaDescription", "seo.keywords"];
    for (const p of DESTINATION_PAGES) check(Destination, p, fields);
  });

  it("data-da servisin tanımadığı açar yoxdur", () => {
    // Tanınmayan açar (məs. `body`, `seo.title`) import zamanı səssizcə atılardı.
    const known = { course: ["slug", "lead", "excerpt", "contentHtml", "info", "faq", "seo"], destination: ["slug", "lead", "contentHtml", "facts", "faq", "seo"] };
    const seoKeys = ["metaTitle", "metaDescription", "keywords"];
    for (const [kind, list] of [["course", COURSE_PAGES], ["destination", DESTINATION_PAGES]]) {
      for (const p of list) {
        for (const k of Object.keys(p)) expect(known[kind], `${p.slug}: naməlum açar «${k}»`).toContain(k);
        for (const k of Object.keys(p.seo || {})) expect(seoKeys, `${p.slug}: naməlum seo açarı «${k}»`).toContain(k);
      }
    }
  });
});

describe("SEO və mətn keyfiyyəti", () => {
  it("meta başlıq 65 simvoldan uzun deyil", () => {
    const long = ALL.filter((p) => p.seo.metaTitle.az.length > 65).map((p) => `${p.slug} (${p.seo.metaTitle.az.length})`);
    expect(long, `uzun başlıq: ${long.join(", ")}`).toEqual([]);
  });

  it("meta təsvir 71–179 simvoldur", () => {
    const bad = ALL.map((p) => [p.slug, p.seo.metaDescription.az.length]).filter(([, n]) => n <= 70 || n >= 180);
    expect(bad, `təsvir uzunluğu: ${bad.map(([s, n]) => `${s} (${n})`).join(", ")}`).toEqual([]);
  });

  it("meta başlıqlar təkrarlanmır", () => {
    const titles = ALL.map((p) => p.seo.metaTitle.az);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("mətnli səhifədə ən azı 2 h2 başlıq var", () => {
    for (const p of ALL.filter(htmlOf)) {
      expect((htmlOf(p).match(/<h2>/g) || []).length, `${p.slug}: h2`).toBeGreaterThanOrEqual(2);
    }
  });

  it("HTML yalnız redaktorun tanıdığı teqlərdəndir", () => {
    const allowed = new Set(["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "br"]);
    const bad = [];
    for (const p of ALL) for (const m of htmlOf(p).matchAll(/<([a-z0-9]+)[\s>]/gi)) if (!allowed.has(m[1].toLowerCase())) bad.push(`${p.slug}: <${m[1]}>`);
    expect([...new Set(bad)]).toEqual([]);
  });

  it("daxili linklər mövcud səhifələrə gedir", () => {
    const bad = [];
    for (const p of ALL) {
      for (const [, href] of htmlOf(p).matchAll(/href="([^"]*)"/g)) {
        const m = href.match(/^\/(kurslar|xaricde-tehsil)\/([^"?#]+)$/);
        if (m) {
          const list = m[1] === "kurslar" ? COURSES : DESTINATIONS;
          if (!list.includes(m[2])) bad.push(`${p.slug}: ${href}`);
        } else if (!/^\/(testler|elaqe)$/.test(href)) {
          bad.push(`${p.slug}: ${href}`);
        }
      }
    }
    expect(bad, `yanlış link:\n${bad.join("\n")}`).toEqual([]);
  });

  it("səhifə öz-özünə link vermir", () => {
    for (const p of COURSE_PAGES) expect(htmlOf(p), p.slug).not.toContain(`href="/kurslar/${p.slug}"`);
    for (const p of DESTINATION_PAGES) expect(htmlOf(p), p.slug).not.toContain(`href="/xaricde-tehsil/${p.slug}"`);
  });

  it("mətndə qiymət yoxdur", () => {
    // Qiymətlər panelin qiymət matrisindədir — mətndə köhnəlir.
    const bad = ALL.filter((p) => /\d+\s*(AZN|azn|manat|₼|€|\$)/.test(JSON.stringify(p))).map((p) => p.slug);
    expect(bad).toEqual([]);
  });
});

describe("import — yalnız boş sahəni doldurur", () => {
  afterEach(() => vi.restoreAllMocks());

  it("isEmptyText HTML qabığını boş sayır", () => {
    expect(isEmptyText({ az: "<p></p>", en: "", ru: "" })).toBe(true);
    expect(isEmptyText({ az: "<p>&nbsp;</p>" })).toBe(true);
    expect(isEmptyText(undefined)).toBe(true);
    expect(isEmptyText({ az: "", en: "Text" })).toBe(false);
    expect(isEmptyText({ az: "<p>Mətn</p>" })).toBe(false);
  });

  const setup = () => {
    const doc = new Course({
      slug: "workshop",
      contentHtml: { az: "<p>Admin yazıb</p>", en: "", ru: "" },
      seo: { metaTitle: { az: "Admin başlığı", en: "", ru: "" } },
    });
    const save = vi.spyOn(doc, "save").mockResolvedValue(doc);
    vi.spyOn(Course, "findOne").mockImplementation(({ slug }) => Promise.resolve(slug === "workshop" ? doc : null));
    vi.spyOn(Destination, "findOne").mockResolvedValue(null);
    return { doc, save };
  };

  it("admin-in mətninə və başlığına toxunmur, boş sahələri doldurur", async () => {
    const { doc, save } = setup();
    const { report, summary } = await importPageContent();
    const row = report.find((r) => r.slug === "workshop");

    expect(doc.contentHtml.az).toBe("<p>Admin yazıb</p>");
    expect(doc.seo.metaTitle.az).toBe("Admin başlığı");
    expect(row.fields).not.toContain("contentHtml");
    expect(row.fields).not.toContain("seo.metaTitle");

    expect(row.fields).toEqual(expect.arrayContaining(["faq", "info", "lead", "seo.metaDescription"]));
    expect(doc.faq.length).toBeGreaterThan(0);
    expect(save).toHaveBeenCalledTimes(1);
    expect(summary.missing).toBe(COURSE_PAGES.length + DESTINATION_PAGES.length - 1);
  });

  it("quru sınaq heç nə yazmır", async () => {
    const { save } = setup();
    const { report } = await importPageContent({ dryRun: true });
    expect(report.find((r) => r.slug === "workshop").status).toBe("doldurulacaq");
    expect(save).not.toHaveBeenCalled();
  });

  it("overwrite admin mətnini əvəz edir", async () => {
    const { doc } = setup();
    await importPageContent({ overwrite: true });
    expect(doc.contentHtml.az).not.toBe("<p>Admin yazıb</p>");
    expect(doc.seo.metaTitle.az).not.toBe("Admin başlığı");
  });

  it("qiymət, müəllim, şəkil sahələrinə toxunulmur", () => {
    const src = fs.readFileSync("services/PageContentImportService.js", "utf8");
    expect(src).not.toMatch(/pricing|teachers|image|cover|isActive|order/);
  });

  it("marşrut yalnız developer üçündür", () => {
    const routes = fs.readFileSync("routes/adminRoutes.js", "utf8");
    const line = routes.split("\n").find((l) => l.includes("/dev/import-page-content"));
    expect(line, "marşrut yoxdur").toBeTruthy();
    expect(line).toMatch(/devOnly/);
  });
});
