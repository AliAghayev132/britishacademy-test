import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { BLOG_CATEGORIES, BLOG_POSTS } from "../data/blogData.mjs";
import { BlogPost, BlogCategory } from "#models";

/**
 * SEO BLOQ MƏZMUNU.
 *
 * Auditdə çıxan mənzərə: saytda 0 bloq yazısı, 39 kurs/ölkə səhifəsindən
 * 34-ü 40 sözdən az mətnlə, heç birində SEO başlığı yox. Bu dəst həmin
 * boşluğu bloq tərəfdən doldurur.
 *
 * ── TESTİN ƏSAS İŞİ ──
 * Yazılışda tapılan SƏSSİZ nasazlıq: `seo` bloku `title`/`description` ilə
 * yazılmışdı, sxem isə `metaTitle`/`metaDescription` gözləyir. Mongoose
 * tanımadığı sahəni XƏTA VERMƏDƏN atır — nəticədə import «uğurlu» görünür,
 * amma bütün yazılar saytın defolt meta başlığı ilə çıxırdı, yəni SEO
 * dəyəri sıfır olurdu. Aşağıdakı yoxlama sənədi SXEMİN ÖZÜNDƏN keçirir,
 * ona görə hər hansı sahə adı sürüşməsi dərhal tutulur.
 */

describe("məzmunun bütövlüyü", () => {
  it("yazı və kateqoriya var", () => {
    expect(BLOG_CATEGORIES.length).toBeGreaterThanOrEqual(3);
    expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(8);
  });

  it("slug-lar təkrarlanmır və ünvana yararlıdır", () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size, "təkrar slug var").toBe(slugs.length);
    // Azərbaycan hərfləri ünvanda problem yaradır — slug ASCII olmalıdır.
    const bad = slugs.filter((s) => !/^[a-z0-9-]+$/.test(s));
    expect(bad, `yararsız slug: ${bad.join(", ")}`).toEqual([]);
  });

  it("hər yazının kateqoriyası mövcuddur", () => {
    const known = new Set(BLOG_CATEGORIES.map((c) => c.slug));
    const bad = BLOG_POSTS.filter((p) => !known.has(p.category)).map((p) => `${p.slug} → ${p.category}`);
    expect(bad, `naməlum kateqoriya: ${bad.join(", ")}`).toEqual([]);
  });

  it("hər yazıda başlıq, təsvir və mətn var", () => {
    for (const p of BLOG_POSTS) {
      expect(p.title?.az, `${p.slug}: başlıq yoxdur`).toBeTruthy();
      expect(p.excerpt?.az, `${p.slug}: təsvir yoxdur`).toBeTruthy();
      expect(p.content?.az, `${p.slug}: mətn yoxdur`).toBeTruthy();
    }
  });
});

describe("sxemə uyğunluq — səssiz itki olmasın", () => {
  it("`seo` sahələri SXEMİN gözlədiyi adlardadır", () => {
    // Bu, real tapılmış nasazlıqdır: `title`/`description` yazılmışdı,
    // Mongoose onları səssizcə atırdı və bütün yazılar saytın defolt
    // meta başlığı ilə çıxırdı.
    for (const p of BLOG_POSTS) {
      const doc = new BlogPost({ ...p, category: undefined });
      expect(doc.seo?.metaTitle?.az, `${p.slug}: metaTitle sxemə düşmədi`).toBe(p.seo?.metaTitle?.az);
      expect(doc.seo?.metaTitle?.az, `${p.slug}: metaTitle boşdur`).toBeTruthy();
      expect(doc.seo?.metaDescription?.az, `${p.slug}: metaDescription boşdur`).toBeTruthy();
    }
  });

  it("sənəd sxem yoxlamasından keçir", () => {
    for (const p of BLOG_POSTS) {
      const doc = new BlogPost({ ...p, category: undefined, status: "draft" });
      expect(doc.validateSync(), `${p.slug}: sxem xətası`).toBeUndefined();
    }
  });

  it("kateqoriyalar da sxemə uyğundur", () => {
    for (const c of BLOG_CATEGORIES) {
      const doc = new BlogCategory(c);
      expect(doc.validateSync(), `${c.slug}: sxem xətası`).toBeUndefined();
      expect(doc.name?.az).toBe(c.name.az);
    }
  });
});

describe("SEO keyfiyyəti", () => {
  it("meta başlıq axtarış nəticəsində kəsilmir", () => {
    // Google təxminən 60 simvoldan sonrasını kəsir.
    const long = BLOG_POSTS.filter((p) => p.seo.metaTitle.az.length > 65)
      .map((p) => `${p.slug} (${p.seo.metaTitle.az.length})`);
    expect(long, `meta başlıq uzundur: ${long.join(", ")}`).toEqual([]);
  });

  it("meta təsvir mənalı uzunluqdadır", () => {
    for (const p of BLOG_POSTS) {
      const d = p.seo.metaDescription.az;
      expect(d.length, `${p.slug}: təsvir qısadır`).toBeGreaterThan(70);
      expect(d.length, `${p.slug}: təsvir uzundur (kəsiləcək)`).toBeLessThan(180);
    }
  });

  it("hər yazıda başlıq iyerarxiyası var", () => {
    // Divarvari mətn həm oxucu, həm axtarış üçün pisdir.
    for (const p of BLOG_POSTS) {
      const h2 = (p.content.az.match(/<h2>/g) || []).length;
      expect(h2, `${p.slug}: h2 başlıq yoxdur`).toBeGreaterThanOrEqual(2);
    }
  });

  it("hər yazı SAYTIN İÇİNƏ link verir", () => {
    // Bloqun məqsədi axtarışdan gələni kurs/ölkə səhifəsinə ötürməkdir.
    for (const p of BLOG_POSTS) {
      const links = p.content.az.match(/href="(\/[^"]*)"/g) || [];
      expect(links.length, `${p.slug}: daxili link yoxdur`).toBeGreaterThanOrEqual(1);
    }
  });

  it("daxili linklər YALNIZ mövcud bölmələrə gedir", () => {
    // Yazılan slug səhv olsa ziyarətçi 404 alır — bu, ən pis SEO siqnalıdır.
    const ok = /^\/(kurslar|xaricde-tehsil|testler|bloq|elaqe|layiheler|muellimler|filiallar|haqqimizda)(\/|$|\?)/;
    const bad = [];
    for (const p of BLOG_POSTS) {
      for (const m of p.content.az.matchAll(/href="(\/[^"]*)"/g)) {
        if (!ok.test(m[1])) bad.push(`${p.slug}: ${m[1]}`);
      }
    }
    expect(bad, `naməlum daxili yol:\n${bad.join("\n")}`).toEqual([]);
  });

  it("HTML yalnız redaktorun tanıdığı teqlərdən ibarətdir", () => {
    // Gövdə TipTap-a düşür; tanınmayan teq redaktədə itir.
    const allowed = new Set(["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "code", "blockquote", "br"]);
    const bad = [];
    for (const p of BLOG_POSTS) {
      for (const m of p.content.az.matchAll(/<([a-z0-9]+)[\s>]/gi)) {
        if (!allowed.has(m[1].toLowerCase())) bad.push(`${p.slug}: <${m[1]}>`);
      }
    }
    expect(bad, `icazəsiz teq: ${[...new Set(bad)].join(", ")}`).toEqual([]);
  });
});

describe("import davranışı", () => {
  const src = fs.readFileSync("services/BlogImportService.js", "utf8");

  it("mövcud yazının üzərinə yazmır", () => {
    // Admin mətni redaktə etmiş ola bilər — üzərinə yazmaq onun işini silmək
    // olardı. Yalnız açıq `overwrite` ilə əvəz olunur.
    expect(src).toMatch(/if \(!overwrite\)/);
    expect(src).toMatch(/mövcuddur — toxunulmadı/);
  });

  it("defolt olaraq QARALAMA yükləyir", () => {
    // Mətn yoxlanmadan saytda dərc olunmamalıdır.
    expect(src).toMatch(/status: publish \? "published" : "draft"/);
  });

  it("quru sınaq rejimi var", () => {
    expect(src).toMatch(/dryRun = false/);
  });

  it("marşrut yalnız developer üçündür", () => {
    const routes = fs.readFileSync("routes/adminRoutes.js", "utf8");
    const line = routes.split("\n").find((l) => l.includes("/dev/import-blog"));
    expect(line, "marşrut yoxdur").toBeTruthy();
    expect(line).toMatch(/devOnly/);
  });
});
