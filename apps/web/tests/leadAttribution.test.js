import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import {
  captureAttribution,
  getAttribution,
  getConsent,
  setConsent,
  ATTRIBUTION_TTL,
  __resetAttributionForTests,
} from "../src/lib/attribution.js";

/**
 * MÜRACİƏTİN REKLAM MƏNBƏYİ (Google Ads atribusiyası) — sayt tərəfi.
 *
 * Tələb: müraciət hansı kampaniya / açar söz / reklam qrupundan gəlibsə,
 * müraciətlə BİRLİKDƏ serverə getsin və istifadəçi bir neçə səhifə gəzsə də
 * itməsin. Brauzerdə saxlamaq yalnız razılıqla.
 *
 * Əvvəl açılış parametrləri yalnız anonim ziyarət hadisəsinə yazılırdı
 * (track.js) — açar söz və reklam qrupu heç oxunmurdu, müraciətin öz
 * qeydində isə reklam məlumatı yox idi.
 */

const NOW = 1_800_000_000_000;

function fakeWindow({ url = "https://britishacademy.az/", referrer = "" } = {}) {
  const store = new Map();
  const u = new URL(url);
  globalThis.window = {
    location: { search: u.search, pathname: u.pathname, hostname: u.hostname },
    document: { referrer },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    dispatchEvent: () => true,
  };
  return store;
}

/** Yeni səhifə yüklənməsi — eyni brauzer (localStorage qalır), yaddaş sıfırlanır. */
function reload(store, { url, referrer = "" }) {
  __resetAttributionForTests();
  const u = new URL(url);
  window.location = { search: u.search, pathname: u.pathname, hostname: u.hostname };
  window.document = { referrer };
  return store;
}

const AD_URL =
  "https://britishacademy.az/kurslar/ingilis-dili?utm_source=google&utm_medium=cpc&utm_campaign=21458930412&utm_term=ingilis%20dili%20kursu&utm_content=158832211044&gclid=Cj0KCQ";

beforeEach(() => __resetAttributionForTests());
afterEach(() => {
  delete globalThis.window;
});

describe("açılışda tutma", () => {
  it("Google Ads parametrləri (açar söz, reklam qrupu daxil) götürülür", () => {
    fakeWindow({ url: AD_URL, referrer: "https://www.google.com/" });
    captureAttribution(NOW);
    expect(getAttribution(NOW)).toEqual({
      source: "google",
      medium: "cpc",
      campaign: "21458930412",
      term: "ingilis dili kursu",
      content: "158832211044",
      gclid: "Cj0KCQ",
      landing: "/kurslar/ingilis-dili",
      referrerHost: "google.com",
      ts: NOW,
    });
  });

  it("saytdaxili keçid mənbəni silmir (SPA naviqasiyası — yaddaş qalır)", () => {
    fakeWindow({ url: AD_URL });
    captureAttribution(NOW);
    window.location = { search: "", pathname: "/elaqe", hostname: "britishacademy.az" };
    window.document = { referrer: "https://britishacademy.az/kurslar/ingilis-dili" };
    captureAttribution(NOW + 1000);
    expect(getAttribution(NOW + 1000)?.campaign).toBe("21458930412");
  });

  it("parametr və kənar referer yoxdursa heç nə göndərilmir", () => {
    fakeWindow({ url: "https://britishacademy.az/" });
    captureAttribution(NOW);
    expect(getAttribution(NOW)).toBeUndefined();
  });

  it("yalnız referer varsa (organik axtarış) — o da yazılır", () => {
    fakeWindow({ url: "https://britishacademy.az/", referrer: "https://www.google.com/" });
    captureAttribution(NOW);
    expect(getAttribution(NOW)).toMatchObject({ referrerHost: "google.com", landing: "/" });
  });
});

describe("razılıq", () => {
  it("razılıq yoxdursa brauzerə HEÇ NƏ yazılmır, yeni yüklənmədə mənbə itir", () => {
    const store = fakeWindow({ url: AD_URL });
    captureAttribution(NOW);
    expect(store.has("ba-attr")).toBe(false);
    reload(store, { url: "https://britishacademy.az/" });
    captureAttribution(NOW + 1000);
    expect(getAttribution(NOW + 1000)).toBeUndefined();
  });

  it("razılıq verildikdə yaddaşdakı mənbə saxlanılır və günlər sonra da müraciətə gedir", () => {
    const store = fakeWindow({ url: AD_URL });
    captureAttribution(NOW);
    setConsent("granted");
    expect(getConsent()).toBe("granted");
    expect(store.has("ba-attr")).toBe(true);

    const later = NOW + 10 * 864e5;
    reload(store, { url: "https://britishacademy.az/" });
    captureAttribution(later);
    expect(getAttribution(later)?.campaign).toBe("21458930412");
  });

  it("30 gündən köhnə qeyd nəzərə alınmır", () => {
    const store = fakeWindow({ url: AD_URL });
    setConsent("granted");
    captureAttribution(NOW);
    reload(store, { url: "https://britishacademy.az/" });
    expect(getAttribution(NOW + ATTRIBUTION_TTL + 1)).toBeUndefined();
  });

  it("rədd ediləndə saxlanılan qeyd silinir", () => {
    const store = fakeWindow({ url: AD_URL });
    setConsent("granted");
    captureAttribution(NOW);
    setConsent("denied");
    expect(store.has("ba-attr")).toBe(false);
    expect(getConsent()).toBe("denied");
  });
});

describe("son reklam kliki qalib gəlir", () => {
  it("yeni reklam kliki köhnəni əvəz edir", () => {
    const store = fakeWindow({ url: AD_URL });
    setConsent("granted");
    captureAttribution(NOW);
    reload(store, { url: "https://britishacademy.az/?utm_source=google&utm_medium=cpc&utm_campaign=999" });
    captureAttribution(NOW + 1000);
    expect(getAttribution(NOW + 1000)).toMatchObject({ campaign: "999" });
    expect(getAttribution(NOW + 1000).term).toBeUndefined(); // köhnə klikin açar sözü qarışmır
  });

  it("reklamdan sonra organik axtarışla qayıtmaq reklamı silmir", () => {
    const store = fakeWindow({ url: AD_URL });
    setConsent("granted");
    captureAttribution(NOW);
    reload(store, { url: "https://britishacademy.az/", referrer: "https://www.google.com/" });
    captureAttribution(NOW + 1000);
    expect(getAttribution(NOW + 1000)?.campaign).toBe("21458930412");
  });
});

describe("bağlantılar", () => {
  const read = (p) => fs.readFileSync(p, "utf8");

  it("hər iki müraciət forması mənbəni müraciətlə birlikdə göndərir", () => {
    expect(read("src/components/site/ApplyModal.jsx")).toMatch(/attribution: getAttribution\(\)/);
    expect(read("src/components/site/ContactForm.jsx")).toMatch(/attribution: getAttribution\(\)/);
  });

  it("açılışda tutulur, razılıq banneri bütün saytda var", () => {
    expect(read("src/components/site/SiteTracker.jsx")).toMatch(/captureAttribution\(\)/);
    expect(read("src/components/site/SiteProvider.jsx")).toMatch(/<ConsentBanner \/>/);
  });

  it("banner mətnləri üç dildədir", () => {
    const strings = read("src/lib/i18n/strings.js");
    for (const key of ["consent.text", "consent.accept", "consent.decline"]) {
      expect(strings.split(`"${key}"`).length - 1, key).toBe(3);
    }
  });

  it("admin siyahısında reklam sütunları və kanal filtri var", () => {
    const view = read("src/app/(protected)/dashboard/muracietler/LeadsView.jsx");
    for (const col of ["Mənbə", "Kampaniya", "Açar söz", "Reklam qrupu"]) {
      expect(view).toContain(`>${col}</th>`);
    }
    expect(view).toMatch(/"attribution\.channel": channel/);
    expect(view).toMatch(/<AdCampaignsModal /);
  });

  it("kanal açarları serverdəki siyahı ilə eynidir", () => {
    // `apps/web` ayrıca repo kimi də klonlana bilir — qonşu yoxdursa ötür.
    const API = "../api/utils/leadAttribution.js";
    if (!fs.existsSync(API)) return;
    const api = read(API);
    const web = read("src/app/(protected)/dashboard/muracietler/adChannels.js");
    const serverKeys = [...api.match(/ATTRIBUTION_CHANNELS = \[([^\]]+)\]/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const webKeys = [...web.matchAll(/key: "([^"]+)"/g)].map((m) => m[1]);
    expect(webKeys.sort()).toEqual([...serverKeys].sort());
  });
});
