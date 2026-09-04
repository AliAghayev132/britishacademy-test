import { describe, it, expect } from "vitest";
import { metroLabel, addressLine, districtAdds } from "@/utils/branch";

/**
 * Filial mətnləri üç səhifədə göstərilir və hər birində ayrıca
 * formatlaşdırılırdı. Aşağıdakılar müştərinin bildirdiyi REAL hallardır.
 */

describe("metroLabel", () => {
  it("suffiksi olmayan ada onu əlavə edir", () => {
    // Konkret hal: Əhmədli filialının metrosu «Əhmədli» yazılmışdı və kartda
    // «Əhmədli, Babək pr. 88 · Əhmədli» kimi görünürdü — sonuncunun metro
    // olduğu bilinmirdi.
    expect(metroLabel("Əhmədli", "az")).toBe("Əhmədli m.");
    expect(metroLabel("Ahmadli", "en")).toBe("Ahmadli metro");
    expect(metroLabel("Ахмедлы", "ru")).toBe("м. Ахмедлы");
  });

  it("mövcud suffiksə toxunmur", () => {
    expect(metroLabel("Nizami m.", "az")).toBe("Nizami m.");
    expect(metroLabel("Elmlər Akademiyası m.", "az")).toBe("Elmlər Akademiyası m.");
    expect(metroLabel("Nizami metro", "en")).toBe("Nizami metro");
    expect(metroLabel("м. Низами", "ru")).toBe("м. Низами");
  });

  it("adın içindəki «m» hərfini suffiks saymır", () => {
    // «Memar Əcəmi» — nöqtəsiz «m» suffiks deyil.
    expect(metroLabel("Memar Əcəmi", "az")).toBe("Memar Əcəmi m.");
  });

  it("boş dəyərdə boş qaytarır", () => {
    expect(metroLabel("", "az")).toBe("");
    expect(metroLabel(null, "az")).toBe("");
    expect(metroLabel(undefined)).toBe("");
  });

  it("naməlum dildə AZ formasına düşür", () => {
    expect(metroLabel("Nizami", "de")).toBe("Nizami m.");
  });
});

describe("addressLine", () => {
  it("ünvanda olmayan rayonu əlavə edir", () => {
    expect(addressLine("Azaro Plaza, 3-cü mərtəbə", "Nərimanov"))
      .toBe("Azaro Plaza, 3-cü mərtəbə, Nərimanov");
  });

  it("ünvanda ARTIQ olan rayonu təkrarlamır", () => {
    // Müştərinin bildirdiyi hal: «Əhmədli, Babək pr. 88, Əhmədli».
    expect(addressLine("Əhmədli, Babək pr. 88", "Əhmədli"))
      .toBe("Əhmədli, Babək pr. 88");
  });

  it("böyük/kiçik hərf və diakritikə görə də tanıyır", () => {
    expect(addressLine("ƏHMƏDLI, Babək pr. 88", "Əhmədli")).toBe("ƏHMƏDLI, Babək pr. 88");
    expect(addressLine("Ahmadli, 88 Babek Ave", "Ahmadli")).toBe("Ahmadli, 88 Babek Ave");
    expect(addressLine("Ахмедли, пр. Бабека 88", "Ахмедли")).toBe("Ахмедли, пр. Бабека 88");
  });

  it("rayon boşdursa ünvanı olduğu kimi verir", () => {
    // Caspian Plaza-da rayon boşdur — sonda vergül qalmamalıdır.
    expect(addressLine("C.Cabbarlı 44, Caspian Plaza, 9-cu mərtəbə", ""))
      .toBe("C.Cabbarlı 44, Caspian Plaza, 9-cu mərtəbə");
    expect(addressLine("C.Cabbarlı 44", null)).toBe("C.Cabbarlı 44");
  });

  it("ünvan boşdursa rayonu tək qaytarır", () => {
    expect(addressLine("", "Yasamal")).toBe("Yasamal");
  });
});

describe("districtAdds", () => {
  it("təkrar rayonu «faydasız» sayır", () => {
    expect(districtAdds("Əhmədli, Babək pr. 88", "Əhmədli")).toBe(false);
    expect(districtAdds("Azaro Plaza", "Nərimanov")).toBe(true);
    expect(districtAdds("İstənilən ünvan", "")).toBe(false);
  });
});
