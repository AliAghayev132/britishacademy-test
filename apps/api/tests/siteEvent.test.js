import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { SiteEvent } from "#models";
import {
  recordClientEvent, recordLeadSubmit, resolveSource, cleanPath, buildFunnel,
} from "../services/SiteEventService.js";

/**
 * MÜRACİƏT HUNİSİ: sayta giriş → forma açıldı → müraciət göndərildi.
 * Əsas qaydalar: saytdan «göndərdim» qəbul olunmur (saxtalaşdırıla bilər),
 * sessiyada bir ziyarət, botlar sayılmır, şəxsi məlumat saxlanılmır.
 */

const SID = "a1b2c3d4e5f6a1b2c3d4e5f6";
const CHROME = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const chain = (v) => ({ select: () => ({ lean: async () => v }) });

afterEach(() => vi.restoreAllMocks());

describe("mənbə və yol", () => {
  it("utm_source hər şeydən üstündür", () => {
    expect(resolveSource({ referrer: "https://google.com/", utm: { source: "Instagram_Story" } })).toBe("instagram_story");
  });
  it("reklam klik kodları", () => {
    expect(resolveSource({ utm: { gclid: true } })).toBe("google-ads");
    expect(resolveSource({ utm: { fbclid: true } })).toBe("facebook/instagram");
  });
  it("saytın öz səhifəsindən gələn referer «birbaşa»dır", () => {
    expect(resolveSource({ referrer: "https://www.britishacademy.az/kurslar", host: "britishacademy.az" })).toBe("birbaşa");
  });
  it("xarici referer — yalnız domen", () => {
    expect(resolveSource({ referrer: "https://l.instagram.com/?u=x", host: "britishacademy.az" })).toBe("instagram.com");
    expect(resolveSource({})).toBe("birbaşa");
  });
  it("yoldan sorğu sətri atılır", () => {
    expect(cleanPath("/kurslar/toefl?utm_source=x&email=a@b.c")).toBe("/kurslar/toefl");
    expect(cleanPath("https://evil.com")).toBe("/");
  });
});

describe("saytdan gələn hadisə", () => {
  it("«lead_submit» saytdan QƏBUL OLUNMUR", async () => {
    const create = vi.spyOn(SiteEvent, "create");
    const upd = vi.spyOn(SiteEvent, "updateOne");
    const r = await recordClientEvent({ type: "lead_submit", sid: SID }, { ua: CHROME });
    expect(r.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(upd).not.toHaveBeenCalled();
  });

  it("yararsız sid və botlar atılır", async () => {
    const upd = vi.spyOn(SiteEvent, "updateOne");
    expect((await recordClientEvent({ type: "visit", sid: "x" }, { ua: CHROME })).ok).toBe(false);
    expect((await recordClientEvent({ type: "visit", sid: SID }, { ua: "Googlebot/2.1" })).ok).toBe(false);
    expect(upd).not.toHaveBeenCalled();
  });

  it("ziyarət sessiyada BİR dəfə yazılır (upsert + $setOnInsert)", async () => {
    const upd = vi.spyOn(SiteEvent, "updateOne").mockResolvedValue({ upsertedCount: 1 });
    await recordClientEvent(
      { type: "visit", sid: SID, path: "/kurslar?x=1", referrer: "https://l.instagram.com/", utm: { campaign: "Yay 2026!" } },
      { ua: CHROME, host: "britishacademy.az" },
    );
    const [filter, update, opts] = upd.mock.calls[0];
    expect(filter).toEqual({ sid: SID, type: "visit" });
    expect(opts).toEqual({ upsert: true });
    expect(update.$setOnInsert).toMatchObject({ path: "/kurslar", source: "instagram.com", device: "desktop", campaign: "yay2026" });
  });

  it("forma açılışı sessiyanın mənbəyini götürür", async () => {
    vi.spyOn(SiteEvent, "findOne").mockReturnValue(chain({ source: "google-ads", campaign: "ielts" }));
    const create = vi.spyOn(SiteEvent, "create").mockResolvedValue({});
    await recordClientEvent({ type: "modal_open", sid: SID, path: "/kurslar/ielts-kurslari" }, { ua: CHROME });
    expect(create.mock.calls[0][0]).toMatchObject({ type: "modal_open", path: "/kurslar/ielts-kurslari", source: "google-ads", campaign: "ielts" });
  });

  it("ziyarəti olmayan sessiyaya ziyarət əlavə olunur — huni ardıcıl qalır", async () => {
    vi.spyOn(SiteEvent, "findOne").mockReturnValue(chain(null));
    const upd = vi.spyOn(SiteEvent, "updateOne").mockResolvedValue({});
    vi.spyOn(SiteEvent, "create").mockResolvedValue({});
    await recordClientEvent({ type: "modal_open", sid: SID, path: "/" }, { ua: CHROME });
    expect(upd.mock.calls[0][0]).toEqual({ sid: SID, type: "visit" });
  });
});

describe("müraciət — yalnız serverdə", () => {
  it("sid yoxdursa heç nə yazılmır", async () => {
    const create = vi.spyOn(SiteEvent, "create");
    expect(await recordLeadSubmit(undefined, { path: "/" })).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("müraciət sessiyaya bağlanır", async () => {
    vi.spyOn(SiteEvent, "findOne").mockReturnValue(chain({ source: "instagram.com" }));
    const create = vi.spyOn(SiteEvent, "create").mockResolvedValue({});
    await recordLeadSubmit(SID, { path: "/kurslar/toefl", form: "apply-modal", ua: CHROME });
    expect(create.mock.calls[0][0]).toMatchObject({ type: "lead_submit", form: "apply-modal", source: "instagram.com", path: "/kurslar/toefl" });
  });

  it("leadController müraciət YARANDIQDAN sonra yazır", () => {
    const src = fs.readFileSync("controllers/leadController.js", "utf8");
    expect(src.indexOf("recordLeadSubmit(req.body?.sid")).toBeGreaterThan(src.indexOf("await Lead.create("));
  });

  it("marşrut açıqdır, amma müraciət orada yazılmır", () => {
    const routes = fs.readFileSync("routes/publicRoutes.js", "utf8");
    expect(routes).toMatch(/PublicRouter\.post\("\/events", eventController\.track\)/);
    const svc = fs.readFileSync("services/SiteEventService.js", "utf8");
    expect(svc).toMatch(/const CLIENT_TYPES = new Set\(\["visit", "modal_open"\]\)/);
  });
});

describe("statistikanın qurulması", () => {
  const now = new Date("2026-09-11T12:00:00Z");
  const data = buildFunnel(
    {
      byType: [
        { _id: "visit", sessions: 200, events: 200 },
        { _id: "modal_open", sessions: 40, events: 55 },
        { _id: "lead_submit", sessions: 10, events: 11 },
      ],
      daily: [
        { _id: { day: "2026-09-11", type: "visit" }, sessions: 20 },
        { _id: { day: "2026-09-11", type: "lead_submit" }, sessions: 2 },
      ],
      pages: [
        { _id: { path: "/kurslar/toefl", type: "modal_open" }, sessions: 5 },
        { _id: { path: "/kurslar/toefl", type: "lead_submit" }, sessions: 2 },
        { _id: { path: "/", type: "modal_open" }, sessions: 30 },
      ],
      sources: [
        { _id: { source: "instagram.com", type: "visit" }, sessions: 50 },
        { _id: { source: "instagram.com", type: "lead_submit" }, sessions: 4 },
        { _id: { source: "google", type: "visit" }, sessions: 90 },
      ],
      devices: [{ _id: "mobile", sessions: 150 }],
    },
    { days: 7, now },
  );

  it("cəmlər unikal sessiya ilə, açılış sayı ayrıca", () => {
    expect(data.totals).toEqual({ visits: 200, opens: 40, openEvents: 55, submits: 10, submitEvents: 11 });
  });

  it("boş günlər də seriyadadır, son gün bu gündür (Bakı vaxtı)", () => {
    expect(data.series).toHaveLength(7);
    expect(data.series.at(-1)).toEqual({ date: "2026-09-11", visits: 20, opens: 0, submits: 2 });
    expect(data.series[0]).toEqual({ date: "2026-09-05", visits: 0, opens: 0, submits: 0 });
  });

  it("səhifə və mənbə sətirləri birləşdirilib sıralanır", () => {
    expect(data.pages[0]).toEqual({ path: "/", opens: 30, submits: 0 });
    expect(data.pages[1]).toEqual({ path: "/kurslar/toefl", opens: 5, submits: 2 });
    expect(data.sources.map((s) => s.source)).toEqual(["google", "instagram.com"]);
    expect(data.sources[1]).toEqual({ source: "instagram.com", visits: 50, opens: 0, submits: 4 });
  });
});

describe("model", () => {
  it("köhnə qeydlər avtomatik silinir və IP sahəsi yoxdur", () => {
    const idx = SiteEvent.schema.indexes().find(([k, o]) => k.ts === 1 && o.expireAfterSeconds);
    expect(idx).toBeTruthy();
    expect(SiteEvent.schema.path("ip")).toBeUndefined();
  });
});
