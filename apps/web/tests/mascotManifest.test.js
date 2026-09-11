import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * KONSOLDAKI İKİ XƏTA.
 *
 * 1) «GET /assets/mascot/read.png 404» — `MASCOTS` xəritəsi README-də
 *    olmayan adlara aparırdı (courses → study, blog → read …), qovluqda isə
 *    fayllar səhifə adı ilə idi. HƏR daxili səhifənin banneri 404 alırdı.
 * 2) «Error while trying to use the following icon from the Manifest …
 *    Resource size is not correct» — admin favicon-u (PNG) manifest-ə
 *    `sizes: "any"` ilə düşürdü; «any» yalnız SVG üçün keçərlidir.
 */

vi.mock("@/components/site/LocaleLink", () => ({ LocaleLink: () => null }));

const MASCOT_DIR = "public/assets/mascot";
const pngSize = (file) => {
  const b = fs.readFileSync(file);
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
};

/** Səhifələrdə işlədilən bütün `mascot="…"` açarları. */
function usedMascotKeys(dir = "src/app", out = new Set()) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) usedMascotKeys(p, out);
    else if (/\.jsx?$/.test(e.name)) for (const m of fs.readFileSync(p, "utf8").matchAll(/mascot="([^"]+)"/g)) out.add(m[1]);
  }
  return out;
}

describe("maskot — mövcud olmayan fayla sorğu getmir", () => {
  it("hər açar ya MÖVCUD fayla, ya da null-a çevrilir", async () => {
    const { mascotFileFor } = await import("@/components/site/PageBanner");
    const keys = [...usedMascotKeys()];
    expect(keys.length).toBeGreaterThan(5);
    for (const key of keys) {
      const file = mascotFileFor(key);
      if (file) expect(fs.existsSync(path.join(MASCOT_DIR, `${file}.png`)), `${key} → ${file}.png`).toBe(true);
    }
  });

  it("fayl adı səhifə açarının özüdür (README ilə eyni)", async () => {
    const { mascotFileFor } = await import("@/components/site/PageBanner");
    // courses.png qovluqda var — əvvəl xəritə onu «study.png»-ə aparırdı.
    expect(mascotFileFor("courses")).toBe("courses");
    expect(mascotFileFor("home")).toBe("hero");
  });

  it("faylı olmayan açar sorğu yaratmır", async () => {
    const { mascotFileFor } = await import("@/components/site/PageBanner");
    expect(mascotFileFor("yoxdur-bele-fayl")).toBeNull();
    expect(mascotFileFor("../../secret")).toBeNull();
    expect(mascotFileFor(undefined)).toBeNull();
  });

  it("səhifələrdəki hər açar README-də sənədləşib", () => {
    const readme = fs.readFileSync(path.join(MASCOT_DIR, "README.md"), "utf8");
    const missing = [...usedMascotKeys()].filter((k) => !readme.includes(`\`${k}.png\``));
    expect(missing, `README-də yoxdur: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("manifest ikonları", () => {
  const load = async (settings) => {
    vi.resetModules();
    vi.doMock("@/lib/seo", () => ({ getSiteSettings: async () => settings, SITE_NAME: "BA", DEFAULT_DESCRIPTION: "d" }));
    return (await import("@/app/manifest.js")).default();
  };

  it("PNG favicon «any» ölçüsü ilə düşmür (Chrome xəbərdarlığı)", async () => {
    const m = await load({ brand: { favicon: "/assets/favicon.png" } });
    const bad = m.icons.filter((i) => i.sizes === "any" && !/svg/.test(i.type));
    expect(bad).toEqual([]);
  });

  it("SVG favicon «any» ilə əlavə olunur", async () => {
    const m = await load({ brand: { favicon: "/uploads/logo.svg" } });
    expect(m.icons[0]).toEqual({ src: "/uploads/logo.svg", sizes: "any", type: "image/svg+xml" });
  });

  it("elan olunan ölçü faylın REAL ölçüsüdür", async () => {
    const m = await load({});
    for (const i of m.icons.filter((x) => x.src.startsWith("/assets/"))) {
      expect(pngSize(path.join("public", i.src)), i.src).toBe(i.sizes);
    }
  });

  it("ikonlar təkrarlanmır", async () => {
    const m = await load({ brand: { favicon: "/assets/favicon.png" } });
    const keys = m.icons.map((i) => `${i.src}|${i.sizes}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
