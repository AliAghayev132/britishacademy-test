import { describe, it, expect } from "vitest";
import { isInlineSvg, svgDataUri } from "@/utils/svgDataUri";

describe("svgDataUri — bayraqlar DOMPurify-sız", () => {
  it("inline SVG-ni tanıyır, URL-i yox", () => {
    expect(isInlineSvg('  <svg viewBox="0 0 3 2"></svg>')).toBe(true);
    expect(isInlineSvg("/uploads/flags/de.svg")).toBe(false);
    expect(isInlineSvg("")).toBe(false);
  });

  it("mətni data URI-yə kodlaşdırır — atribut/HTML-ə çıxa bilməz", () => {
    const uri = svgDataUri('<svg onload="alert(1)"><script>alert(2)</script></svg>');
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    // Dırnaq və < kodlaşdırılır — src="..." atributundan çıxmaq mümkün deyil.
    expect(uri).not.toMatch(/["<>]/);
  });
});
