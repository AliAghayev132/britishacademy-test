import { describe, it, expect } from "vitest";
import { fmtDate, fmtDateTime, fmtNumber, fmtTime } from "@/utils/format";

// 2026-09-14 09:05:07 UTC = 13:05:07 Bakı (UTC+4).
const AT = "2026-09-14T09:05:07Z";

describe("admin formatlayıcıları", () => {
  it("vaxtı brauzerin deyil, Bakı saat qurşağında göstərir", () => {
    expect(fmtTime(AT)).toBe("13:05");
    expect(fmtTime(AT, { seconds: true })).toBe("13:05:07");
    expect(fmtDateTime(AT)).toMatch(/14\.09\.2026.*13:05/);
    expect(fmtDateTime(AT, { year: false })).not.toMatch(/2026/);
  });

  it("Bakıda gecə yarısını keçən UTC axşamı növbəti günə düşür", () => {
    expect(fmtDate("2026-09-14T21:30:00Z")).toBe("15.09.2026");
  });

  it("boş və yanlış dəyərdə «Invalid Date» yox, tire", () => {
    expect(fmtDateTime(null)).toBe("—");
    expect(fmtDate("bu tarix deyil")).toBe("—");
    expect(fmtDate(undefined, "")).toBe("");
  });

  it("rəqəmləri qruplaşdırır, boşu 0 sayır", () => {
    expect(fmtNumber(undefined)).toBe("0");
    expect(fmtNumber(12345).replace(/\s/g, " ")).toMatch(/12.345/);
  });
});
