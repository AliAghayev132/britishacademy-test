import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { ldJson } from "@/lib/jsonLd";
import { safeRedirect } from "@/lib/safeRedirect";
import { sanitizeDialogText } from "@/components/ui/feedback";

/**
 * FAZA 1 — AUDİTİN TƏHLÜKƏSİZLİK TAPINTILARI (sayt tərəfi).
 *
 * #5 təsdiq pəncərəsində HTML, #6 JSON-LD, #7 GTM/kod inyeksiyası admin
 * paneldə, #10 CI deploy-u saxlamırdı, #17 şəkil optimizatoru, #23 girişdən
 * sonra xarici sayta yönləndirmə, #25 «İmtina» üzərində Enter.
 */

const read = (f) => fs.readFileSync(f, "utf8");

describe("#6 JSON-LD", () => {
  it("</script> skriptdən çıxa bilmir, dəyər dəyişmir", () => {
    const data = { name: "Kurs</script><script>alert(1)</script>" };
    const out = ldJson(data);
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual(data);
  });

  it("səhifələrdə xam JSON.stringify qalmayıb", () => {
    const pages = [
      "src/app/layout.js",
      "src/app/(public)/kurslar/[slug]/page.js",
      "src/app/(public)/bloq/[slug]/page.js",
      "src/app/(public)/muellimler/[slug]/page.js",
      "src/app/(public)/xaricde-tehsil/[slug]/page.js",
      "src/app/(public)/filiallar/page.js",
      "src/components/JsonLd.jsx",
    ];
    for (const p of pages) {
      const src = read(p);
      expect(src, p).not.toMatch(/__html: JSON\.stringify\(/);
      expect(src, p).toMatch(/ldJson\(/);
    }
  });
});

describe("#23 girişdən sonra yönləndirmə", () => {
  it("yalnız panelin öz yolları qəbul olunur", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
    expect(safeRedirect("/dashboard/linkler?x=1")).toBe("/dashboard/linkler?x=1");
    expect(safeRedirect("https://evil.example/panel")).toBe("/dashboard");
    expect(safeRedirect("//evil.example")).toBe("/dashboard");
    expect(safeRedirect("/dashboardevil")).toBe("/dashboard");
    expect(safeRedirect("/dashboard\\evil")).toBe("/dashboard");
    expect(safeRedirect(null)).toBe("/dashboard");
  });

  it("giriş səhifəsi yoxlanmış ünvanı işlədir", () => {
    const src = read("src/app/(auth)/login/page.js");
    expect(src).toMatch(/router\.push\(safeRedirect\(searchParams\.get\('from'\)\)\)/);
  });
});

describe("#5 + #25 təsdiq pəncərəsi", () => {
  it("formatlama qalır, skript və atributlar silinir", () => {
    const out = sanitizeDialogText(`<b>Ali</b><br><img src=x onerror="alert(1)"><a href="javascript:x">y</a>`);
    expect(out).toContain("<b>Ali</b>");
    expect(out).toContain("<br>");
    expect(out).not.toMatch(/img|onerror|href|javascript/);
  });

  it("pəncərə mətni təmizlənmiş HTML ilə render olunur", () => {
    const src = read("src/components/ui/feedback.jsx");
    expect(src).toMatch(/__html: sanitizeDialogText\(dialog\.text\)/);
    expect(src).not.toMatch(/__html: dialog\.text \}/);
  });

  it("Enter yalnız təsdiq düyməsi fokusdadırsa təsdiqləyir", () => {
    const src = read("src/components/ui/feedback.jsx");
    expect(src).toMatch(/e\.key === "Enter" && document\.activeElement === okRef\.current/);
  });
});

describe("#7 GTM və kod inyeksiyası", () => {
  it("kök layout-da YOXDUR (admin paneli və girişi də əhatə edir)", () => {
    const root = read("src/app/layout.js");
    expect(root).not.toMatch(/<GtmScript|<GtmNoScript|<CodeInjection/);
  });

  it("yalnız ictimai sayt layout-undadır", () => {
    const pub = read("src/app/(public)/layout.js");
    expect(pub).toMatch(/<GtmScript id=\{inject\.gtmId\}/);
    expect(pub).toMatch(/<CodeInjection head=\{inject\.head\}/);
  });
});

describe("#17 şəkil optimizatoru", () => {
  it("istənilən hosta açıq nümunə yoxdur", () => {
    const cfg = read("next.config.mjs");
    expect(cfg).not.toMatch(/hostname:\s*['"]\*\*['"]/);
  });
});

describe("#10 deploy yalnız CI uğurla bitəndə", () => {
  for (const [f, job] of [
    [".github/workflows/deploy-client.yml", "deploy-client"],
    ["../api/.github/workflows/deploy-server.yml", "deploy-server"],
  ]) {
    it(`${job}`, () => {
      const src = read(f);
      expect(src).toMatch(/workflow_run:\s*\n\s*workflows: \[CI\]/);
      expect(src).toMatch(/github\.event\.workflow_run\.conclusion == 'success'/);
      expect(src).not.toMatch(/^on:\s*\n\s*push:/m);
    });
  }

  it("CI workflow-unun adı deploy-dakı istinadla eynidir", () => {
    expect(read(".github/workflows/ci.yml")).toMatch(/^name: CI$/m);
    expect(read("../api/.github/workflows/ci.yml")).toMatch(/^name: CI$/m);
  });
});
