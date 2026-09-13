import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { dateRange as buildRange, bakuDays, bakuDayStart } from "#utils";

// Tarix aralığı filtri. Ən vacib detal: `to` GÜNÜN SONUNA qədər götürülür.
// Əks halda «1 sentyabrdan 1 sentyabra» seçəndə aralıq 00:00–00:00 olur və
// həmin günün heç bir qeydi tapılmır — istifadəçi üçün tam gözlənilməzdir.
//
// Günlər Bakı vaxtı ilə hesablanır (audit #39) — serverin saatından asılı deyil.

describe("tarix aralığı", () => {
  it("yalnız başlanğıc verilir", () => {
    const r = buildRange("2026-09-01", "");
    expect(r.$gte).toBeInstanceOf(Date);
    expect(r.$lte).toBeUndefined();
  });

  it("yalnız son verilir", () => {
    const r = buildRange("", "2026-09-01");
    expect(r.$lte).toBeInstanceOf(Date);
    expect(r.$gte).toBeUndefined();
  });

  it("eyni gün seçiləndə həmin günün QEYDLƏRİ tapılır", () => {
    const r = buildRange("2026-09-01", "2026-09-01");
    // Gün ərzindəki bir qeyd aralığa düşməlidir
    const midday = new Date("2026-09-01T13:45:00.000Z");
    expect(midday >= r.$gte).toBe(true);
    expect(midday <= r.$lte).toBe(true);
  });

  it("son tarix Bakı gününün sonuna qədər uzanır", () => {
    const r = buildRange("", "2026-09-01");
    expect(r.$lte.toISOString()).toBe("2026-09-01T19:59:59.999Z");
  });

  it("Bakı vaxtı ilə gecə 02:00-da gələn müraciət həmin günə düşür", () => {
    const r = buildRange("2026-09-02", "2026-09-02");
    const night = new Date("2026-09-02T02:00:00+04:00");
    expect(night >= r.$gte && night <= r.$lte).toBe(true);
    expect(bakuDays(3, new Date("2026-09-01T22:30:00Z"))).toEqual(["2026-08-31", "2026-09-01", "2026-09-02"]);
    expect(bakuDayStart("2026-09-02").toISOString()).toBe("2026-09-01T20:00:00.000Z");
  });

  it("statistika ekranları eyni saat qurşağını işlədir", () => {
    for (const f of ["controllers/statsController.js", "controllers/linkController.js"]) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/setHours\(|toISOString\(\)\.slice\(0, 10\)/);
      expect(src, f).not.toMatch(/\$dateToString: \{ format: "%Y-%m-%d", date: "\$\w+" \}/);
    }
  });

  it("etibarsız tarix nəzərə alınmır", () => {
    expect(buildRange("belə-tarix-yoxdur", "")).toBeNull();
    expect(buildRange("", "yanlış")).toBeNull();
  });

  it("boş dəyərlərdə filtr qurulmur", () => {
    expect(buildRange("", "")).toBeNull();
    expect(buildRange(undefined, undefined)).toBeNull();
  });
});
