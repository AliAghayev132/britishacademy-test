import { describe, it, expect } from "vitest";
import fs from "node:fs";

/**
 * KURSUN FİLİAL QİYMƏT KARTLARI.
 *
 * 1) Filial üzrə «Qeyd» (admin: kurs → filiallar və qiymət) saxlanılırdı və
 *    API-dən gəlirdi, amma kartda göstərilmirdi.
 * 2) Kartların üstündəki ümumi izah («Axşam qrupları — qrup üçün +10 AZN,
 *    fərdi üçün +20 AZN») hər kurs üçün doğru deyildi — sahibinin istəyi ilə
 *    çıxarıldı.
 */

const cards = fs.readFileSync("src/components/site/PriceCards.jsx", "utf8");
const strings = fs.readFileSync("src/lib/i18n/strings.js", "utf8");
const css = fs.readFileSync("src/styles/globals.css", "utf8");

describe("qiymət kartları", () => {
  it("filial qeydi kartda göstərilir", () => {
    expect(cards).toContain('{p.note && <p className="ba-pricecard-note">{p.note}</p>}');
    // Admin qeydi bir neçə sətirlə yaza bilər — sətir sonları itməsin.
    expect(css).toMatch(/\.ba-pricecard-note \{[^}]*white-space: pre-line;/);
  });

  it("«+10 / +20 AZN» ümumi izahı yoxdur (3 dildə)", () => {
    expect(cards).not.toContain("price.intro");
    expect(strings).not.toContain('"price.intro"');
    expect(strings).not.toContain("Axşam qrupları — qrup dərsi üçün +10 AZN");
  });
});
