import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { classifyChannel, sanitizeAttribution, ATTRIBUTION_CHANNELS } from "#utils";
import { Lead } from "#models";
import { PRIVATE_SETTING_FIELDS } from "../controllers/public/shared.js";

/**
 * MÜRACİƏTİN REKLAM MƏNBƏYİ (Google Ads atribusiyası).
 *
 * Tələb: admin paneldə hər müraciətin hansı Google Ads kampaniyasından
 * gəldiyini görmək — mənbə, kampaniya, açar söz, reklam qrupu.
 *
 * Əvvəl reklam məlumatı yalnız ANONİM ZİYARƏT hadisəsində saxlanılırdı
 * (`SiteEvent.source/campaign`), açar söz və reklam qrupu heç oxunmurdu,
 * `gclid`-in yalnız var/yox olduğu yazılırdı. Müraciətin öz qeydində isə
 * heç nə yox idi.
 */

afterEach(() => vi.restoreAllMocks());

describe("kanal təyini", () => {
  it("gclid UTM olmasa da Google Ads deməkdir", () => {
    expect(classifyChannel({ gclid: "Cj0KCQ" })).toBe("google-ads");
  });

  it("google + cpc → Google Ads", () => {
    expect(classifyChannel({ source: "google", medium: "cpc" })).toBe("google-ads");
  });

  it("ödənişli Meta reklamı ayrıca kanaldır", () => {
    expect(classifyChannel({ source: "facebook", medium: "paid_social" })).toBe("meta-ads");
    expect(classifyChannel({ source: "instagram", medium: "cpc" })).toBe("meta-ads");
  });

  it("UTM yoxdursa referer ilə: axtarış → organik, sosial → sosial, qalan → referal", () => {
    expect(classifyChannel({ referrerHost: "www.google.com" })).toBe("organic");
    expect(classifyChannel({ referrerHost: "l.instagram.com" })).toBe("social");
    expect(classifyChannel({ referrerHost: "t.co" })).toBe("social");
    expect(classifyChannel({ referrerHost: "edu.gov.az" })).toBe("referral");
  });

  it("heç bir iz yoxdursa birbaşa", () => {
    expect(classifyChannel({})).toBe("direct");
  });

  it("saytın öz qısa linki ayrıca kanaldır (lib/utm.js bu medium-u qoyur)", () => {
    expect(classifyChannel({ source: "yay-kampaniyasi", medium: "qisa-link" })).toBe("short-link");
  });

  it("hər nəticə icazəli kanallar siyahısındadır", () => {
    for (const a of [{ gclid: "x" }, { source: "x" }, { referrerHost: "a.com" }, {}]) {
      expect(ATTRIBUTION_CHANNELS).toContain(classifyChannel(a));
    }
  });
});

describe("təmizləmə — açıq endpointdir", () => {
  it("Google Ads ValueTrack dəyərləri saxlanılır və kanal hesablanır", () => {
    const a = sanitizeAttribution({
      source: "google", medium: "cpc", campaign: "21458930412", term: "ingilis dili kursu",
      content: "158832211044", gclid: "Cj0KCQiA", landing: "/kurslar/ingilis-dili-kurslari",
      referrerHost: "www.google.com", ts: Date.now() - 3600_000,
    });
    expect(a).toMatchObject({
      channel: "google-ads", campaign: "21458930412", term: "ingilis dili kursu",
      content: "158832211044", gclid: "Cj0KCQiA", landing: "/kurslar/ingilis-dili-kurslari",
    });
    expect(a.capturedAt).toBeInstanceOf(Date);
  });

  it("kanal saytdan GƏLMİR — serverdə hesablanır", () => {
    // Saxta kanal göndərilsə belə nəzərə alınmır.
    expect(sanitizeAttribution({ channel: "google-ads", source: "x" }).channel).toBe("campaign");
  });

  it("yararsız giriş müraciəti sındırmır", () => {
    for (const bad of [null, undefined, "str", 5, [], {}]) {
      expect(sanitizeAttribution(bad)).toBeUndefined();
    }
  });

  it("uzun dəyərlər kəsilir, idarə simvolları atılır", () => {
    const a = sanitizeAttribution({ campaign: "x".repeat(500), term: "a\u0000b\u0007c" });
    expect(a.campaign).toHaveLength(150);
    expect(a.term).toBe("abc");
  });

  it("açılış səhifəsi yalnız saytdaxili yoldur", () => {
    expect(sanitizeAttribution({ source: "g", landing: "javascript:alert(1)" }).landing).toBeUndefined();
    expect(sanitizeAttribution({ source: "g", landing: "https://evil.example/x" }).landing).toBeUndefined();
  });

  it("gələcək tarixli və ya çox köhnə klik vaxtı qəbul edilmir", () => {
    expect(sanitizeAttribution({ source: "g", ts: Date.now() + 864e5 }).capturedAt).toBeUndefined();
    expect(sanitizeAttribution({ source: "g", ts: Date.now() - 400 * 864e5 }).capturedAt).toBeUndefined();
  });
});

describe("müraciət modeli və endpoint", () => {
  it("müraciətin öz qeydində reklam bloku var", () => {
    for (const f of ["channel", "source", "medium", "campaign", "term", "content", "gclid", "landing", "capturedAt"]) {
      expect(Lead.schema.path(`attribution.${f}`), f).toBeTruthy();
    }
  });

  it("müraciət yaradılanda reklam məlumatı təmizlənib yazılır", () => {
    const src = fs.readFileSync("controllers/leadController.js", "utf8");
    expect(src).toMatch(/attribution: sanitizeAttribution\(req\.body\?\.attribution\)/);
  });

  it("admin siyahısı reklam kanalına görə süzülə bilir", () => {
    const src = fs.readFileSync("controllers/admin/crudController.js", "utf8");
    expect(src).toMatch(/"attribution\.channel",/);
  });

  it("kampaniya adları müraciətlər bölməsinin icazəsi ilə qorunur", () => {
    const routes = fs.readFileSync("routes/adminRoutes.js", "utf8");
    expect(routes).toMatch(/AdminRouter\.get\("\/ad-campaigns", requireSection\("leads"\)/);
    expect(routes).toMatch(/AdminRouter\.put\("\/ad-campaigns", requireSection\("leads"\)/);
  });

  it("kampaniya adları ictimai /api/site cavabına sızmır", () => {
    // Siyahı denylist-dir — yeni daxili sahə bura yazılmasa hamıya açılır.
    expect(PRIVATE_SETTING_FIELDS).toContain("adCampaigns");
  });
});

describe("marketinq hesabatları", () => {
  const routes = fs.readFileSync("routes/adminRoutes.js", "utf8");
  const crud = fs.readFileSync("controllers/admin/crudController.js", "utf8");
  const stats = fs.readFileSync("controllers/statsController.js", "utf8");

  it("kampaniya hesabatı və konversiya siyahısı «Statistika» icazəsi ilə", () => {
    expect(routes).toMatch(/AdminRouter\.get\("\/stats\/campaigns", requireSection\("stats"\)/);
    expect(routes).toMatch(/AdminRouter\.get\("\/stats\/google-conversions", requireSection\("stats"\)/);
  });

  it("ixrac marşrutu generic /:resource-dan ƏVVƏL qeydiyyatdadır", () => {
    // Əks halda «leads/export» → getOne(id="export") olardı.
    const exp = routes.indexOf('AdminRouter.get("/leads/export"');
    const generic = routes.indexOf('AdminRouter.get("/:resource"');
    expect(exp).toBeGreaterThan(-1);
    expect(exp).toBeLessThan(generic);
  });

  it("ixrac siyahı ilə EYNİ süzgəcdən keçir (əhatə daxil) və jurnala yazılır", () => {
    const body = crud.slice(crud.indexOf("const exportLeads"));
    expect(body).toMatch(/denySection\(req, res, resource\)/);
    expect(body).toMatch(/buildListFilter\(req, entry, resource\)/);
    expect(body).toMatch(/action: "export"/);
    // Siyahının özü də həmin funksiyadan istifadə edir.
    expect(crud).toMatch(/const filter = buildListFilter\(req, entry, req\.params\.resource\)/);
    expect(crud.slice(crud.indexOf("function buildListFilter"), crud.indexOf("const list ="))).toMatch(/applyLeadScope[\s\S]*applyLeadAccess[\s\S]*applyLeadTopic/);
  });

  it("konversiya cavabında şəxsi məlumat yoxdur, 90 gündən köhnə klik atılır", () => {
    const body = stats.slice(stats.indexOf("const googleConversions"));
    const select = body.match(/\.select\("([^"]+)"\)/)[1];
    for (const pii of ["name", "phone", "email"]) expect(select.split(" ")).not.toContain(pii);
    expect(stats).toMatch(/GCLID_WINDOW_MS = 90 \* 864e5/);
  });

  it("qeydiyyat anı ayrıca saxlanılır və əl ilə yazıla bilməz", () => {
    expect(Lead.schema.path("enrolledAt")).toBeTruthy();
    expect(crud).toMatch(/"handledAt", "enrolledAt"/);
    const model = fs.readFileSync("models/lead.model.js", "utf8");
    expect(model).toMatch(/if \(this\.status === "enrolled"\) \{\s*if \(!this\.enrolledAt\) this\.enrolledAt = new Date\(\);/);
  });
});
