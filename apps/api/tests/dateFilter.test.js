import { describe, it, expect } from "vitest";

// Tarix aralığı filtri. Ən vacib detal: `to` GÜNÜN SONUNA qədər götürülür.
// Əks halda «1 sentyabrdan 1 sentyabra» seçəndə aralıq 00:00–00:00 olur və
// həmin günün heç bir qeydi tapılmır — istifadəçi üçün tam gözlənilməzdir.

/** adminController-dəki məntiqin eynisi. */
function buildRange(from, to) {
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  return Object.keys(range).length ? range : null;
}

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

  it("son tarix günün sonuna qədər uzanır", () => {
    const r = buildRange("", "2026-09-01");
    expect(r.$lte.getHours()).toBe(23);
    expect(r.$lte.getMinutes()).toBe(59);
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
