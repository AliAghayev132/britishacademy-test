import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { NAV_TOP, NAV_GROUPS, NAV_BOTTOM, matchNavItem, searchNav } from "@/lib/adminNav";

/**
 * ADMIN PANELİN NAVİQASİYA AXTARIŞI.
 *
 * Panel 25-ə yaxın bölmədən ibarətdir və onlar dörd açılan qrupa paylanıb.
 * «Telefon nömrəsini haradan dəyişim?» sualının cavabı «Tənzimləmələr»dir,
 * amma bu söz orada heç yerdə yazılmır — buna görə hər bəndə ETİKETLƏR
 * verilib (səhifədə NƏ EDİLDİYİNİ təsvir edən sözlər).
 */

const ALL = [...NAV_TOP, ...NAV_GROUPS.flatMap((g) => g.items), ...NAV_BOTTOM];
const search = (q) => searchNav(q, NAV_GROUPS, [...NAV_TOP, ...NAV_BOTTOM]);
const first = (q) => search(q)[0]?.name;

describe("naviqasiya siyahısı", () => {
  it("hər bəndin adı, ünvanı və ikonu var", () => {
    for (const i of ALL) {
      expect(i.name, JSON.stringify(i)).toBeTruthy();
      expect(i.href, i.name).toMatch(/^\/dashboard/);
      expect(i.icon, i.name).toBeTruthy();
    }
    expect(ALL.length).toBeGreaterThanOrEqual(25);
  });

  it("ünvanlar təkrarlanmır", () => {
    const seen = new Set();
    const dup = ALL.filter((i) => (seen.has(i.href) ? true : (seen.add(i.href), false)));
    expect(dup.map((d) => d.href)).toEqual([]);
  });

  it("HƏR bəndin etiketi var", () => {
    // Etiketsiz bənd yalnız öz adı ilə tapılır — axtarışın bütün mənası
    // məhz adda olmayan sözlərlə tapmaqdır.
    const bare = ALL.filter((i) => !(i.tags || []).length).map((i) => i.name);
    expect(bare, `etiketi olmayan bölmə: ${bare.join(", ")}`).toEqual([]);
  });

  it("etiket bəndin öz adını təkrarlamır", () => {
    // «Kurslar» bəndinə «kurslar» etiketi yazmaq yer tutur, fayda vermir.
    const bad = [];
    for (const i of ALL) {
      for (const t of i.tags || []) {
        if (t.toLowerCase() === i.name.toLowerCase()) bad.push(`${i.name}: «${t}»`);
      }
    }
    expect(bad, `adı təkrarlayan etiket:\n${bad.join("\n")}`).toEqual([]);
  });
});

describe("axtarış — Azərbaycan hərfləri", () => {
  it("diakritiksiz yazmaq işləyir", () => {
    // Klaviaturasında «ə» olmayan (və ya tələsən) istifadəçi belə yazır.
    expect(first("tenzimleme")).toBe("Tənzimləmələr");
    expect(first("muellim")).toBe("Müəllimlər");
    expect(first("layihe")).toBe("Layihələr");
    expect(search("icaze")[0].name).toBe("İstifadəçilər");
  });

  it("böyük/kiçik hərf fərq etmir", () => {
    expect(first("TELEFON")).toBe(first("telefon"));
  });

  it("boş sorğu heç nə qaytarmır", () => {
    expect(search("")).toEqual([]);
    expect(search("   ")).toEqual([]);
    expect(matchNavItem(ALL[0], "")).toBeNull();
  });
});

describe("axtarış — sıralama", () => {
  it("«telefon» → Tənzimləmələr birincidir", () => {
    // Həm Filiallarda, həm Tənzimləmələrdə «telefon» etiketi var. Üst lentdəki
    // nömrə Tənzimləmələrdən dəyişilir, ona görə o, əvvəldə olmalıdır —
    // qərarı etiketin siyahıdakı SIRASI verir.
    const r = search("telefon");
    expect(r[0].name).toBe("Tənzimləmələr");
    expect(r.map((x) => x.name)).toContain("Filiallar");
  });

  it("«qr» → WhatsApp birincidir", () => {
    // «qr» sözü «qrup», «qrafik», «qrafiki» içində də keçir — dəqiq etiket
    // uyğunluğu bu səs-küyü üstələməlidir.
    expect(first("qr")).toBe("WhatsApp");
    expect(search("qr").map((x) => x.name)).toContain("İzlənilən linklər");
  });

  it("«sual» → FAQ birincidir", () => {
    expect(first("sual")).toBe("FAQ");
  });

  it("adın başlanğıcı etiketdən güclüdür", () => {
    expect(first("kurs")).toBe("Kurslar");
    expect(first("bloq")).toBe("Bloq yazıları");
  });

  it("uyğunluq etiketdən gəlirsə etiket qaytarılır", () => {
    // Nəticə sətrində göstərilir — istifadəçi «niyə bu çıxdı?» sualına
    // cavab görür.
    expect(search("telefon")[0].matchedTag).toBe("telefon");
    expect(search("endirim")[0].matchedTag).toBe("endirim");
    // Ad üzrə uyğunluqda etiket yoxdur.
    expect(search("tenzimleme")[0].matchedTag).toBeNull();
  });

  it("qrup adı ilə də tapılır", () => {
    const r = search("sistem");
    expect(r.length).toBeGreaterThan(3);
    expect(r.every((x) => x.groupLabel === "Sistem")).toBe(true);
  });
});

describe("axtarış — icazə sərhədi", () => {
  it("yalnız verilən bəndlərin içində axtarır", () => {
    // Sidebar qrupları ARTIQ icazəyə görə süzülmüş göndərir. Axtarış özü
    // xam siyahıya baxsaydı, istifadəçi görməli olmadığı bölmənin adını
    // (və ünvanını) görərdi.
    const onlyLeads = NAV_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((i) => i.section === "leads") }))
      .filter((g) => g.items.length);
    const r = searchNav("telefon", onlyLeads, []);
    expect(r.map((x) => x.name)).not.toContain("Tənzimləmələr");
  });
});

describe("bölmə açarları serverin ağ siyahısındadır", () => {
  it("hər `section` adminSections-dədir", () => {
    // `apps/web` ayrıca repo kimi də klonlana bilir — qonşu qovluq yoxdursa ötür.
    const F = "../api/constants/shared/enums.js";
    if (!fs.existsSync(F)) return;
    const src = fs.readFileSync(F, "utf8");
    const m = src.match(/adminSections\s*=\s*\[([\s\S]*?)\]/);
    expect(m, "adminSections tapılmadı — format dəyişib?").toBeTruthy();
    const known = [...m[1].matchAll(/["']([a-z-]+)["']/g)].map((x) => x[1]);
    expect(known.length).toBeGreaterThan(10);

    // Tanınmayan açar serverdə səssizcə süzülür və BOŞ icazə massivi qalır —
    // boş isə «məhdudiyyət yoxdur» deməkdir (səlahiyyət artımı).
    const unknown = [...new Set(ALL.map((i) => i.section).filter(Boolean))]
      .filter((s) => !known.includes(s));
    expect(unknown, `adminSections-də yoxdur: ${unknown.join(", ")}`).toEqual([]);
  });
});
