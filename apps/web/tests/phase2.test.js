import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

/**
 * FAZA 2 — auditin sayt tərəfi tapıntıları.
 * #11 sihirbaz qrup id-lərini göndərir, #12 videolar silinirdi, #13 baxış
 * sayğacı, #15 hər səhifəyə tam sənədlər, #16 Socket.IO ictimai saytda,
 * #19 honeypot.
 */

const read = (f) => fs.readFileSync(f, "utf8");

describe("#12 kontentdəki videolar", () => {
  it("YouTube iframe qalır, başqa host silinir", () => {
    const out = sanitizeHtml(
      `<p>a</p><iframe src="https://www.youtube.com/embed/abc"></iframe><iframe src="https://evil.example/x"></iframe>`,
    );
    expect(out).toContain("youtube.com/embed/abc");
    expect(out).not.toContain("evil.example");
  });

  it("detal səhifələri standart DOMPurify işlətmir", () => {
    for (const p of [
      "src/app/(public)/kurslar/[slug]/page.js",
      "src/app/(public)/muellimler/[slug]/page.js",
      "src/app/(public)/xaricde-tehsil/[slug]/page.js",
      "src/app/(public)/layiheler/[slug]/page.js",
      "src/app/(public)/bloq/[slug]/page.js",
      "src/app/(public)/haqqimizda/page.js",
    ]) {
      const src = read(p);
      expect(src, p).not.toMatch(/DOMPurify/);
      expect(src, p).toMatch(/sanitizeHtml\(/);
    }
  });
});

describe("#13 baxış sayğacı", () => {
  it("hər detal səhifəsi öz DB slug-u ilə sayır", () => {
    const cases = [
      ["src/app/(public)/kurslar/[slug]/page.js", `<ViewBeacon type="course" slug={course.slug} />`],
      ["src/app/(public)/muellimler/[slug]/page.js", `<ViewBeacon type="teacher" slug={t.slug} />`],
      ["src/app/(public)/xaricde-tehsil/[slug]/page.js", `<ViewBeacon type="destination" slug={d.slug} />`],
      ["src/app/(public)/layiheler/[slug]/page.js", `<ViewBeacon type="project" slug={p.slug} />`],
      ["src/app/(public)/bloq/[slug]/page.js", `<ViewBeacon type="blog" slug={p.slug} />`],
    ];
    for (const [p, tag] of cases) expect(read(p), p).toContain(tag);
  });

  it("sessiyada bir dəfə göndərilir", () => {
    const src = read("src/components/site/ViewBeacon.jsx");
    expect(src).toMatch(/sessionStorage\.getItem\(key\)/);
    expect(src).toMatch(/\/views/);
  });
});

describe("#15 menyuya yalnız lazımi sahələr", () => {
  it("layout tam sənədləri klient komponentlərinə ötürmür", () => {
    const src = read("src/app/(public)/layout.js");
    expect(src).not.toMatch(/destinations=\{destinations\}/);
    expect(src).not.toMatch(/branches=\{branches\}/);
    expect(src).toMatch(/destinations\.map\(\(\{ _id, country, slug, flag \}\)/);
    expect(src).toMatch(/push\(\{ _id: c\._id, title: c\.title, slug: c\.slug \}\)/);
  });
});

describe("#16 Socket.IO yalnız admin panelində", () => {
  it("kök provayderlər socket yükləmir", () => {
    expect(read("src/app/providers.jsx")).not.toMatch(/SocketContext|SocketProvider/);
  });

  it("panel layout-u socket qoşur", () => {
    expect(read("src/app/(protected)/layout.js")).toMatch(/<SocketProvider>\{children\}<\/SocketProvider>/);
  });

  it("ictimai komponentlər socket işlətmir", () => {
    const dir = "src/components/site";
    // Alt qovluqlar (header/, quiz/, cards/) da yoxlanır.
    for (const f of fs.readdirSync(dir, { recursive: true })) {
      if (fs.statSync(`${dir}/${f}`).isDirectory()) continue;
      expect(read(`${dir}/${f}`), f).not.toMatch(/useSocket|SocketContext/);
    }
  });
});

describe("#19 honeypot", () => {
  it("müraciət və əlaqə formalarında gizli tələ sahəsi var", () => {
    for (const p of ["src/components/site/ApplyModal.jsx", "src/components/site/ContactForm.jsx"]) {
      const src = read(p);
      expect(src, p).toMatch(/name="website"/);
      expect(src, p).toMatch(/tabIndex=\{-1\}/);
    }
  });
});

describe("#11 kurs sihirbazı", () => {
  it("qrupların id və kodu göndərilir (server silib yaratmır)", () => {
    const src = read("src/app/(protected)/dashboard/_forms/CourseWizard.jsx");
    expect(src).toMatch(/_id: g\._id \|\| undefined,\s*\n\s*code: g\.code \|\| undefined/);
  });
});
