import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { PRIVACY } from "../src/app/(public)/mexfilik-siyaseti/content.js";

/**
 * OPENAI REKLAM PİKSELİ.
 *
 * Qərar (2026-11-02): razılıq gözlənilmədən hər ziyarətçidə yüklənir. Ona
 * görə məxfilik siyasəti bunu açıq yazmalıdır — əvvəlki mətn «reklam
 * məqsədilə üçüncü tərəflərə verilmir» deyirdi.
 */

const pixel = fs.readFileSync("src/components/site/OpenAIPixel.jsx", "utf8");
const publicLayout = fs.readFileSync("src/app/(public)/layout.js", "utf8");
const rootLayout = fs.readFileSync("src/app/layout.js", "utf8");

describe("OpenAI pikseli", () => {
  it("OpenAI-ın parçası və piksel ID-si", () => {
    expect(pixel).toContain("https://bzrcdn.openai.com/sdk/oaiq.min.js");
    expect(pixel).toContain('const PIXEL_ID = "Kb33tH92Gv6M2j1DttZxek";');
    expect(pixel).toContain('oaiq("init",{pixelId:"${PIXEL_ID}"');
  });

  it("yalnız ictimai saytda — admin paneldə və girişdə yox", () => {
    expect(publicLayout).toContain("<OpenAIPixel />");
    expect(rootLayout).not.toContain("OpenAIPixel");
  });

  it("məxfilik siyasəti pikseli üç dildə adlandırır", () => {
    for (const l of ["az", "en", "ru"]) expect(JSON.stringify(PRIVACY[l]), l).toContain("OpenAI");
    // Köhnə, artıq doğru olmayan cümlə qalmamalıdır.
    expect(JSON.stringify(PRIVACY.az)).not.toContain("reklam məqsədilə üçüncü tərəflərə verilmir");
    // Piksel «automatic advanced matching» ilə formadakı e-poçt/telefonu hash-ləyib
    // göndərir (OpenAI panelindəki ayar) — mətn bunu deməlidir, əksini yox.
    for (const l of ["az", "en", "ru"]) expect(JSON.stringify(PRIVACY[l]), l).toContain("SHA-256");
    expect(JSON.stringify(PRIVACY.az)).not.toContain("reklam platformalarına verilmir");
  });
});
