import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { resourceLabel, ADMIN_RESOURCES } from "@/lib/adminResources";

/**
 * BÖLMƏ ADLARI AZƏRBAYCANCA.
 *
 * Əməliyyat jurnalında xam açar görünürdü — «faqs yaradıldı»,
 * «course-groups silindi», süzgəcdə isə «short-links». Panel istifadəçisi
 * bu adları heç yerdə görmür; onun üçün bölmələr «FAQ», «Dərs qrafiki»,
 * «İzlənilən linklər»dir.
 *
 * Adlar İKİ yerdədir və uyğun qalmalıdır:
 *   • server  — jurnal xülasəsini yazır (controllers/resourceRegistry.js)
 *   • panel   — süzgəc və sətir etiketləri (lib/adminResources.js)
 */

describe("resourceLabel", () => {
  it("ümumi resursların adını qaytarır", () => {
    expect(resourceLabel("courses")).toBe("Kurslar");
    expect(resourceLabel("faqs")).toBe("FAQ");
    expect(resourceLabel("course-groups")).toBe("Dərs qrafiki");
  });

  it("öz səhifəsi olan bölmələri də tanıyır", () => {
    // Bunlar `ADMIN_RESOURCES`-də yoxdur (ümumi resurs brauzeri onları
    // idarə etmir), amma jurnala düşür.
    expect(resourceLabel("settings")).toBe("Tənzimləmələr");
    expect(resourceLabel("whatsapp")).toBe("WhatsApp");
    expect(resourceLabel("dev")).toBe("Developer alətləri");
    expect(resourceLabel("short-links")).toBe("İzlənilən linklər");
  });

  it("tanınmayan açarda açarın özünü qaytarır", () => {
    // Səssizcə boş qalmasın — yeni bölmə əlavə olunanda görünsün.
    expect(resourceLabel("uydurma-resurs")).toBe("uydurma-resurs");
    expect(resourceLabel("")).toBe("—");
    expect(resourceLabel(undefined)).toBe("—");
  });

  it("heç bir ad xam açar kimi qalmayıb", () => {
    // Ad tərcümə olunmayıbsa (məs. «faqs» → «faqs») istifadəçi yenə xam
    // açar görür — bu, düzəlişin mənasını itirir.
    const bad = Object.keys(ADMIN_RESOURCES).filter((k) => resourceLabel(k) === k);
    expect(bad, `tərcümə olunmayıb: ${bad.join(", ")}`).toEqual([]);
  });
});

describe("server ilə uyğunluq", () => {
  /** `apps/web` ayrıca repo kimi də klonlana bilir — qonşu yoxdursa ötür. */
  const REG = "../api/controllers/resourceRegistry.js";

  it("serverin yazdığı hər ad paneldə də tanınır", () => {
    if (!fs.existsSync(REG)) return;
    const src = fs.readFileSync(REG, "utf8");
    const block = src.match(/export const RESOURCE_LABELS = \{([\s\S]*?)\n\};/);
    expect(block, "RESOURCE_LABELS tapılmadı — ad dəyişib?").toBeTruthy();

    const pairs = [...block[1].matchAll(/^\s*"?([a-z-]+)"?:\s*"([^"]+)",/gm)]
      .map(([, k, v]) => ({ key: k, label: v }));
    expect(pairs.length, "server siyahısı oxunmadı").toBeGreaterThan(10);

    // Eyni açar üçün iki tərəf FƏRQLİ ad verməməlidir: jurnalın xülasəsi
    // serverdən, sətrin etiketi isə paneldən gəlir — bir sətirdə iki
    // müxtəlif ad görünərdi.
    const mismatch = pairs
      .filter((p) => resourceLabel(p.key) !== p.label)
      .map((p) => `${p.key}: server «${p.label}» ↔ panel «${resourceLabel(p.key)}»`);
    expect(mismatch, `adlar uyğun gəlmir:\n${mismatch.join("\n")}`).toEqual([]);
  });
});
