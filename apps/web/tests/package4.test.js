import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { formatDate } from "@/lib/i18n/date";
import { t as translate } from "@/lib/i18n/strings";

/**
 * AUDİT — dördüncü paket (web): #30 #31 #32 #33 #34 #35 #53 #54.
 */

const read = (f) => fs.readFileSync(f, "utf8");
afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/api");
});

describe("#30 sitemap", () => {
  const load = async (urls) => {
    vi.doMock("@/lib/api", () => ({ apiGet: async () => (urls ? { urls } : null) }));
    return (await import("@/app/sitemap.js")).default();
  };

  it("hər dil ayrıca giriş alır, eyni hreflang dəsti ilə", async () => {
    const out = await load([{ path: "/elaqe", priority: 0.6 }]);
    expect(out.map((e) => new URL(e.url).pathname)).toEqual(["/elaqe", "/en/contact", "/ru/kontakty"]);
    for (const e of out) expect(Object.keys(e.alternates.languages)).toEqual(["az", "en", "ru"]);
  });

  it("lastmod yoxdursa «indi» yazılmır", async () => {
    const out = await load([{ path: "/elaqe" }, { path: "/bloq", lastmod: "2026-09-01T10:00:00Z" }]);
    expect(out[0].lastModified).toBeUndefined();
    expect(out[3].lastModified.toISOString()).toBe("2026-09-01T10:00:00.000Z");
  });

  it("API əlçatmazdırsa əsas səhifələr qalır", async () => {
    const out = await load(null);
    const paths = out.map((e) => new URL(e.url).pathname);
    expect(paths).toContain("/layiheler");
    expect(paths).toContain("/en/about");
    expect(paths.some((p) => p.startsWith("/filiallar/"))).toBe(false);
  });
});

describe("#31 EN/RU mətnlər və ünvanlar", () => {
  it("tarix seçilmiş dildə yazılır", () => {
    const d = "2026-09-14T10:00:00Z";
    expect(formatDate(d, "en")).toMatch(/September/);
    expect(formatDate(d, "ru")).toMatch(/сентября/);
    expect(formatDate("", "en")).toBe("");
  });

  it("meta açarları üç dildə var", () => {
    for (const key of ["meta.teacherSuffix", "meta.abroadPrefix", "meta.categoryDesc", "nav.menu"]) {
      const az = translate("az", key);
      expect(az, key).not.toBe(key);
      expect(translate("en", key), key).not.toBe(az);
      expect(translate("ru", key), key).not.toBe(az);
    }
  });

  it("JSON-LD və breadcrumb ünvanları cari dildə qurulur, sabit azərbaycanca yoxdur", () => {
    for (const f of ["kurslar/[slug]", "muellimler/[slug]", "xaricde-tehsil/[slug]", "bloq/[slug]"]) {
      const src = read(`src/app/(public)/${f}/page.js`);
      expect(src, f).not.toMatch(/item: `\$\{SITE_URL\}\//);
      expect(src, f).toMatch(/absUrl\(/);
    }
    expect(read("src/app/(public)/muellimler/[slug]/page.js")).not.toMatch(/— Müəllim`/);
    expect(read("src/app/(public)/xaricde-tehsil/[slug]/page.js")).not.toMatch(/`Xaricdə təhsil: /);
    for (const f of ["src/app/(public)/page.js", "src/app/(public)/bloq/page.js", "src/app/(public)/bloq/[slug]/page.js"]) {
      expect(read(f), f).not.toMatch(/"az-AZ"/);
    }
  });
});

describe("#32 yükləmə pərdələri", () => {
  it("giriş pərdəsi yoxdur, keçid göstəricisi gecikmə ilə və minimumsuz", () => {
    expect(read("src/components/site/Header.jsx")).not.toMatch(/function IntroLoader|<IntroLoader/);
    const src = read("src/components/site/RouteLoader.jsx");
    expect(src).toMatch(/const DELAY_MS = 300;/);
    expect(src).not.toMatch(/MIN_MS/);
  });
});

describe("#33 JS-dən əvvəl görünən məzmun", () => {
  it(".ba-reveal yalnız body.ba-fx olanda gizlədilir, reduced-motion nəzərə alınır", () => {
    const css = read("src/styles/globals.css");
    expect(css).not.toMatch(/^\.ba-reveal \{ opacity: 0;/m);
    expect(css).toMatch(/body\.ba-fx \.ba-reveal:not\(\.is-visible\) \{ opacity: 0;/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\n\s*\.ba-reveal \{ transition: none; \}/);
    expect(read("src/components/site/RevealOnScroll.jsx")).toMatch(/r\.top < vh && r\.bottom > 0/);
  });

  it("statistika sayğacı serverdə son dəyəri render edir", () => {
    expect(read("src/components/site/Hero.jsx")).toMatch(/const \[n, setN\] = useState\(target\);/);
  });
});

describe("#34 əlçatanlıq", () => {
  it("modal, axtarış və mobil menyu fokus hook-unu işlədir", () => {
    const modal = read("src/components/site/ApplyModal.jsx");
    expect(modal).toMatch(/aria-labelledby="ba-apply-title"/);
    expect(modal).toMatch(/aria-label=\{t\("apply\.close"\)\}/);
    expect(modal).toMatch(/aria-label=\{t\("apply\.name"\)\}/);
    expect(read("src/components/site/SearchOverlay.jsx")).toMatch(/useDialogFocus\(open, \{ initialFocus: inputRef, onEscape: onClose \}\)/);
    const header = read("src/components/site/Header.jsx");
    expect(header).toMatch(/inert=\{!mobile\}/);
    expect(header).not.toMatch(/aria-label="Menyu"/);
  });

  it("hook fokus tələsi, scroll kilidi və fokusun qaytarılmasını edir", () => {
    const src = read("src/components/site/useDialogFocus.js");
    expect(src).toMatch(/document\.body\.style\.overflow = "hidden"/);
    expect(src).toMatch(/previous\.focus\(/);
    expect(src).toMatch(/e\.key !== "Tab"/);
  });
});

describe("#35 keş başlıqları", () => {
  it("şrift və şəkillər max-age=0 ilə verilmir", async () => {
    const cfg = (await import("../next.config.mjs")).default;
    const rules = await cfg.headers();
    const cc = (src) => rules.find((r) => r.source === src)?.headers.find((h) => h.key === "Cache-Control")?.value;
    expect(cc("/fonts/:path*")).toMatch(/max-age=2592000/);
    expect(cc("/assets/:path*")).toMatch(/max-age=604800/);
    expect(read("src/components/site/TeacherBrowser.jsx")).toMatch(/loading="lazy"/);
  });
});

describe("#53 / #54", () => {
  it("giriş səhifələri indekslənmir", async () => {
    const { metadata } = await import("@/app/(auth)/layout.js");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("aktiv menyu lokallaşdırılmış ünvanda da işləyir; SVG bayraq URL kimi verilmir", () => {
    expect(read("src/components/site/Header.jsx")).toMatch(/const canonical = stripLocale\(pathname\);/);
    // SVG mətni birbaşa src-ə yazılmır — data URI-yə çevrilir (DOMPurify-sız, skript işləmir).
    expect(read("src/components/site/ApplyModal.jsx")).toMatch(/isInlineSvg\(d\.flag\) \? svgDataUri\(d\.flag\) : d\.flag/);
    expect(read("src/components/site/cards.jsx")).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
