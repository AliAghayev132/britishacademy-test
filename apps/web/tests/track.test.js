import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";

/**
 * MÜRACİƏT HUNİSİ — sayt tərəfi.
 * Hadisələr iki yerə gedir: saytın öz bazası (/api/events) və GTM
 * (dataLayer). Ad/telefon/e-poçt heç birinə getmir.
 */

let store;
let fetchMock;

async function load() {
  vi.resetModules();
  return import("@/lib/track");
}

beforeEach(() => {
  store = {};
  fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
  globalThis.window = {
    localStorage: {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
    },
    crypto: globalThis.crypto,
    fetch: fetchMock,
    location: { pathname: "/kurslar/ingilis-dili-kurslari/", search: "?utm_source=instagram&gclid=abc", origin: "https://britishacademy.az" },
    document: { referrer: "https://l.instagram.com/" },
  };
});
afterEach(() => {
  delete globalThis.window;
});

const body = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1].body);

describe("sessiya", () => {
  it("anonim, sabit və 30 dəqiqədən sonra yenilənir", async () => {
    const t = await load();
    const a = t.getSid(1_000);
    expect(a).toMatch(/^[a-f0-9]{24}$/);
    expect(t.getSid(1_000 + 10 * 60_000)).toBe(a);
    expect(t.getSid(1_000 + 10 * 60_000 + 31 * 60_000)).not.toBe(a);
  });
});

describe("hadisələr", () => {
  it("ziyarət sessiyada bir dəfə, mənbə məlumatı ilə", async () => {
    const t = await load();
    t.trackVisit();
    t.trackVisit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const b = body();
    expect(b).toMatchObject({ type: "visit", path: "/kurslar/ingilis-dili-kurslari", referrer: "https://l.instagram.com/" });
    expect(b.utm).toMatchObject({ source: "instagram", gclid: true });
  });

  it("forma açılışı — baza + GTM", async () => {
    const t = await load();
    t.trackModalOpen({ interest: "IELTS" });
    expect(body()).toMatchObject({ type: "modal_open", path: "/kurslar/ingilis-dili-kurslari" });
    expect(window.dataLayer).toContainEqual({ event: "apply_modal_open", page_path: "/kurslar/ingilis-dili-kurslari", interest: "IELTS" });
  });

  it("müraciət — GA üçün generate_lead və …/thank-you virtual səhifəsi", async () => {
    const t = await load();
    t.trackLeadSuccess({ interest: "IELTS" });
    expect(window.dataLayer).toContainEqual(expect.objectContaining({ event: "generate_lead", form: "apply-modal" }));
    expect(window.dataLayer).toContainEqual(expect.objectContaining({
      event: "virtual_pageview",
      page_path: "/kurslar/ingilis-dili-kurslari/thank-you",
      page_location: "https://britishacademy.az/kurslar/ingilis-dili-kurslari/thank-you",
    }));
    // Bazaya müraciət saytdan YAZILMIR — server özü yazır.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ana səhifədə thank-you yolu /thank-you-dur", async () => {
    const t = await load();
    expect(t.thankYouPath("/")).toBe("/thank-you");
  });

  it("server mühitində heç nə sınmır", async () => {
    delete globalThis.window;
    const t = await load();
    expect(() => { t.trackVisit(); t.trackModalOpen(); t.trackLeadSuccess(); }).not.toThrow();
    expect(t.getSid()).toBe("");
  });

  it("şəxsi məlumat göndərilmir", () => {
    const src = fs.readFileSync("src/lib/track.js", "utf8");
    expect(src).not.toMatch(/phone|email|name:/);
  });
});

describe("müraciət formu", () => {
  const src = fs.readFileSync("src/components/site/ApplyModal.jsx", "utf8");
  it("müraciətlə sessiya kodu gedir və uğurda GA hadisəsi atılır", () => {
    expect(src).toMatch(/sid: getSid\(\)/);
    expect(src.indexOf("trackLeadSuccess(")).toBeGreaterThan(src.indexOf("setDone(true)"));
  });
});
