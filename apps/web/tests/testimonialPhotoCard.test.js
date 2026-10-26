import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * ANA SƏHİFƏ RƏYLƏRİ — portret foto kartları.
 *
 * Əvvəl ağ kartın altında 46px-lik dairəvi avatar vardı: tələbənin üzü
 * demək olar görünmürdü. İndi şəkil kartın özüdür (3:4), rəy mətni üstündə.
 *
 * ŞƏKİLSİZ HAL ƏSAS HALDIR: canlıda ana səhifənin 6 rəyinin heç birində
 * şəkil yox idi. Ona görə kart rəyin öz rəngindən və baş hərfdən qurulur.
 */

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const card = read("src/components/site/cards/TestimonialPhotoCard.jsx");
const css = read("src/styles/globals.css");

describe("rəy foto kartı", () => {
  it("ana səhifə yeni kartı işlədir", () => {
    const sec = read("src/app/(public)/_home/TestimonialsSection.jsx");
    expect(sec).toMatch(/<TestimonialPhotoCard key=\{item\._id\} t=\{item\} \/>/);
    expect(sec).toMatch(/className="ba-tpwall"/);
  });

  it("şəkil media hostuna bağlanır (xam nisbi yol deyil)", () => {
    // Xam `/uploads/...` dev mühitində saytın öz originine həll olunub 404 verirdi.
    expect(card).toMatch(/const photo = getImageUrl\(t\.photo\);/);
  });

  it("şəkil yoxdursa baş hərf göstərilir", () => {
    expect(card).toMatch(/photo \? \(/);
    expect(card).toMatch(/className="ba-tpc-mono"/);
  });

  it("kart 3:4 portretdir", () => {
    expect(css).toMatch(/\.ba-tpc \{[^}]*aspect-ratio: 3 \/ 4/s);
  });

  it("uzun rəy kartdan daşmır", () => {
    expect(css).toMatch(/\.ba-tpc-quote \{[^}]*-webkit-line-clamp: 7/s);
  });

  it("jurnal ritmi hover qalxmasını pozmur", () => {
    // Sürüşmə `translate` ilə, hover `transform` ilə — iki ayrı xassə.
    // İkisi də `transform` olsaydı hover sürüşməni ləğv edər, kart sıçrayardı.
    expect(css).toMatch(/\.ba-tpwall > \.ba-tpc:nth-child\(3n\+2\) \{ translate: 0 44px; \}/);
    expect(css).toMatch(/\.ba-tpc:hover \{ transform: translateY\(-6px\)/);
  });

  it("ulduzlar və etiket istənilən rəngdə oxunur", () => {
    // Açıq şüşə fonda qızılı ulduz sarı kartda itirdi; ağa qarışdırılmış
    // etiketdə ağ yazı açıq sarı fonda oxunmurdu.
    expect(css).toMatch(/\.ba-tpc-stars \{[^}]*background: rgba\(10,12,30,\.38\)/s);
    expect(css).toMatch(/\.ba-tpc-ach \{[^}]*color-mix\(in srgb, var\(--c\) 72%, #000 28%\)/s);
  });

  it("telefonda yana sürüşən sıradır", () => {
    expect(css).toMatch(/scroll-snap-type: x mandatory/);
    expect(css).toMatch(/flex: 0 0 min\(300px, 84%\)/);
  });

  it("«Tələbələrimiz» də eyni kartı işlədir, amma telefonda alt-alta", () => {
    // Bu səhifəyə rəyləri OXUMAĞA gəlirlər — karusel onların çoxunu gizlədərdi.
    const page = read("src/app/(public)/telebelerimiz/page.js");
    expect(page).toMatch(/<TestimonialPhotoCard key=\{t\._id\} t=\{t\} \/>/);
    expect(page).toMatch(/className="ba-tpwall ba-tpwall--grid"/);
    expect(css).toMatch(/\.ba-tpwall--grid \{[^}]*grid-template-columns: 1fr/s);
  });

  it("köhnə mətn divarı tamamilə çıxarılıb", () => {
    // İki dizayn yan-yana yaşasaydı biri unudulub köhnələrdi.
    expect(fs.existsSync("src/components/site/cards/TestimonialCard.jsx")).toBe(false);
    expect(css).not.toMatch(/\.ba-wall\b/);
    expect(css).not.toMatch(/\.ba-review\b/);
    // Dairəvi avatar QALIR — kurs və müəllim səhifələri işlədir.
    expect(css).toMatch(/\.ba-av \{/);
  });

  it("hərəkəti azaltma seçimi nəzərə alınır", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\n\s*\.ba-tpc, \.ba-tpc-img \{ transition: none; \}/);
  });
});

describe("admin", () => {
  it("şəkil kəsməsi 3:4 portretdir", () => {
    const specs = read("src/lib/imageSpecs.js");
    const block = specs.slice(specs.indexOf("testimonialAvatar:"), specs.indexOf("// ── Video ──"));
    expect(block).toMatch(/w: 600, h: 800/);
  });
});
