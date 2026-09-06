import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { SECTIONS, sectionForPath, canSee } from "@/lib/permissions";

/**
 * Panelin bölmə siyahısının bütövlüyü.
 *
 * TAPILMIŞ NASAZLIQ: sidebar-dakı «Layihələr» bəndi `section: 'projects'`
 * işlədirdi, amma bu açar nə `SECTIONS` siyahısında, nə də serverin ağ
 * siyahısında vardı. Nəticə iki tərəfli idi:
 *   • superadmin həmin icazəni ümumiyyətlə verə bilmirdi (siyahıda yoxdu);
 *   • server tanınmayan açarı səssizcə atırdı və icazə massivi BOŞALIRDI —
 *     boş isə «məhdudiyyət yoxdur» deməkdir, yəni məhdudlaşdırmaq istənilən
 *     istifadəçi TAM SƏLAHİYYƏT alırdı.
 */

const KEYS = SECTIONS.map((s) => s.key);
const sidebar = fs.readFileSync("src/components/DashboardSidebar.jsx", "utf8");
const usedInSidebar = [...new Set([...sidebar.matchAll(/section:\s*'([a-z-]+)'/g)].map((m) => m[1]))];

describe("bölmə siyahısı", () => {
  it("açarlar təkrarlanmır", () => {
    expect(new Set(KEYS).size).toBe(KEYS.length);
  });

  it("sidebar-da işlədilən HƏR bölmə siyahıdadır", () => {
    const missing = usedInSidebar.filter((s) => !KEYS.includes(s));
    expect(missing, `SECTIONS-də yoxdur: ${missing.join(", ")}`).toEqual([]);
  });

  it("müraciətlərin iki bölməsi var", () => {
    expect(KEYS).toContain("leads");
    expect(KEYS).toContain("leads-abroad");
  });
});

describe("marşrut → bölmə", () => {
  it("xaricdə təhsil müraciətləri AYRI bölməyə düşür", () => {
    // Uzun uyğunluq qısadan ƏVVƏL yoxlanılmalıdır — əks halda alt səhifə
    // ümumi «leads» icazəsinə düşərdi və ayırmanın mənası qalmazdı.
    expect(sectionForPath("/dashboard/muracietler/xaricde-tehsil")).toBe("leads-abroad");
    expect(sectionForPath("/dashboard/muracietler")).toBe("leads");
  });

  it("profil hər kəsə açıqdır", () => {
    expect(sectionForPath("/dashboard/profile")).toBeNull();
  });

  it("layihələr öz bölməsindədir", () => {
    expect(sectionForPath("/dashboard/resurslar/projects")).toBe("projects");
  });
});

describe("canSee", () => {
  const user = (permissions) => ({ role: "admin", permissions });

  it("yalnız «leads» icazəsi xaricdə təhsili AÇMIR", () => {
    expect(canSee(user(["leads"]), "leads")).toBe(true);
    expect(canSee(user(["leads"]), "leads-abroad")).toBe(false);
  });

  it("yalnız «leads-abroad» icazəsi adi müraciətləri AÇMIR", () => {
    expect(canSee(user(["leads-abroad"]), "leads-abroad")).toBe(true);
    expect(canSee(user(["leads-abroad"]), "leads")).toBe(false);
  });

  it("boş icazə hər şeyi açır (geriyə uyğunluq)", () => {
    expect(canSee(user([]), "leads")).toBe(true);
    expect(canSee(user([]), "leads-abroad")).toBe(true);
  });

  it("developer alətləri yalnız developer rolundadır", () => {
    expect(canSee({ role: "superadmin", permissions: [] }, "developer")).toBe(false);
    expect(canSee({ role: "developer", permissions: [] }, "developer")).toBe(true);
  });
});

describe("sidebar ↔ marşrut uyğunluğu", () => {
  /**
   * Hər sidebar bəndinin `section`-u ilə `sectionForPath(href)` EYNİ olmalıdır.
   *
   * TAPILMIŞ NASAZLIQ: «Kurs kateqoriyaları» sidebar-da `courses` bölməsinə
   * aid idi, marşrut xəritəsində isə `/dashboard/resurslar` prefiksinə düşüb
   * `resources` sayılırdı. Nəticədə yalnız «Kurslar» icazəsi olan admin bəndi
   * GÖRÜRDÜ, amma kliklədikdə «icazəniz yoxdur» alırdı.
   *
   * İki siyahı ayrı fayllardadır (biri ikonlarla, biri icazə məntiqi ilə) —
   * bu test onları bir-birinə bağlayır.
   */
  const items = [...sidebar.matchAll(/href:\s*'([^']+)'[^}]*?section:\s*'([a-z-]+)'/g)]
    .map((m) => ({ href: m[1], section: m[2] }));

  it("sidebar bəndləri tapılır", () => {
    expect(items.length).toBeGreaterThan(15);
  });

  it("hər bəndin marşrutu öz bölməsinə həll olunur", () => {
    const bad = items
      .map((i) => ({ ...i, resolved: sectionForPath(i.href) }))
      .filter((i) => i.resolved !== i.section)
      .map((i) => `${i.href}: sidebar «${i.section}» ↔ marşrut «${i.resolved}»`);
    expect(bad, `uyğunsuzluq:\n${bad.join("\n")}`).toEqual([]);
  });
});
