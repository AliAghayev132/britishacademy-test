import { describe, it, expect } from "vitest";
import { movesLeadOutOfReach, ABROAD_INTEREST } from "../controllers/adminController.js";

/**
 * MÜRACİƏTİ ÖZ GÖRMƏ SAHƏSİNDƏN ÇIXARMAQ.
 *
 * Sərhəd OXUMADA qorunurdu, YAZMADA yox. Yalnız «müraciətlər» icazəsi olan
 * adam gördüyü müraciətin maraq növünü «Xaricdə təhsil»ə dəyişəndə sənəd onun
 * siyahısından yox olurdu və özü baxa bilmədiyi bölməyə düşürdü. Səlahiyyət
 * artımı deyil, amma müraciəti cavabsız qoymağın səssiz yoludur — eyni hal
 * ölkə və filial əhatəsində də vardı.
 *
 * Qayda: müraciəti YALNIZ özünün girişi olan bölməyə/əhatəyə köçürmək olar.
 */

const user = (permissions, extra = {}) => ({ role: "admin", permissions, ...extra });
const OPEN = user([]); // boş = məhdudiyyət yoxdur (geriyə uyğunluq)

describe("bölmə sərhədi (maraq növü)", () => {
  it("«leads» adamı müraciəti xaricdə təhsilə köçürə bilmir", () => {
    expect(movesLeadOutOfReach(user(["leads"]), { interest: ABROAD_INTEREST })).toBe("maraq növü");
  });

  it("«leads-abroad» adamı xaricdə təhsili adi növə köçürə bilmir", () => {
    expect(movesLeadOutOfReach(user(["leads-abroad"]), { interest: "IELTS" })).toBe("maraq növü");
  });

  it("hər iki icazəsi olan sərbəstdir — iş bloklanmır", () => {
    const both = user(["leads", "leads-abroad"]);
    expect(movesLeadOutOfReach(both, { interest: ABROAD_INTEREST })).toBeNull();
    expect(movesLeadOutOfReach(both, { interest: "IELTS" })).toBeNull();
  });

  it("məhdudiyyətsiz admin toxunulmur", () => {
    expect(movesLeadOutOfReach(OPEN, { interest: ABROAD_INTEREST })).toBeNull();
  });

  it("növ göndərilmirsə yoxlama aparılmır", () => {
    // Status/qeyd yeniləməsi gündəlik işdir — ona toxunmamalıyıq.
    expect(movesLeadOutOfReach(user(["leads"]), { status: "contacted" })).toBeNull();
    expect(movesLeadOutOfReach(user(["leads"]), { note: "zəng edildi" })).toBeNull();
  });

  it("öz bölməsində qalan dəyişiklik keçir", () => {
    expect(movesLeadOutOfReach(user(["leads"]), { interest: "IELTS" })).toBeNull();
    expect(movesLeadOutOfReach(user(["leads-abroad"]), { interest: ABROAD_INTEREST })).toBeNull();
  });
});

describe("ölkə əhatəsi", () => {
  const TR = "a".repeat(24);
  const DE = "b".repeat(24);
  const scoped = user(["leads", "leads-abroad"], { allowedDestinations: [TR] });

  it("icazəsiz ölkəyə köçürmək bağlıdır", () => {
    expect(movesLeadOutOfReach(scoped, { destinations: [DE] })).toBe("ölkə");
  });

  it("icazəli ölkə siyahıda varsa keçir", () => {
    expect(movesLeadOutOfReach(scoped, { destinations: [TR] })).toBeNull();
    // Qarışıq siyahı: içində icazəli ölkə olduğu üçün müraciət görünən qalır.
    expect(movesLeadOutOfReach(scoped, { destinations: [DE, TR] })).toBeNull();
  });

  it("ölkəni təmizləmək keçir", () => {
    // Ölkəsiz müraciət əhatədən kənar sayılmır (bax applyLeadScope) — yəni
    // siyahını boşaltmaq müraciəti gözdən itirmir.
    expect(movesLeadOutOfReach(scoped, { destinations: [] })).toBeNull();
  });

  it("əhatəsi olmayan admin sərbəstdir", () => {
    expect(movesLeadOutOfReach(user(["leads"]), { destinations: [DE] })).toBeNull();
  });
});

describe("filial əhatəsi", () => {
  const B1 = "c".repeat(24);
  const B2 = "d".repeat(24);
  const scoped = user(["leads"], { allowedBranches: [B1] });

  it("icazəsiz filiala köçürmək bağlıdır", () => {
    expect(movesLeadOutOfReach(scoped, { branch: B2 })).toBe("filial");
  });

  it("icazəli filial keçir", () => {
    expect(movesLeadOutOfReach(scoped, { branch: B1 })).toBeNull();
  });

  it("filialı boşaltmaq keçir", () => {
    // Filialsız müraciət də əhatədən kənar sayılmır.
    expect(movesLeadOutOfReach(scoped, { branch: null })).toBeNull();
  });
});

describe("bir neçə sərhəd birlikdə", () => {
  it("ilk pozulan sərhədin adını qaytarır", () => {
    const u = user(["leads"], { allowedDestinations: ["e".repeat(24)] });
    // Həm növ, həm ölkə pozulur — mesaj üçün biri kifayətdir.
    expect(movesLeadOutOfReach(u, { interest: ABROAD_INTEREST, destinations: ["f".repeat(24)] }))
      .toBe("maraq növü");
  });

  it("boş yeniləmə heç nə qaytarmır", () => {
    expect(movesLeadOutOfReach(user(["leads"]), {})).toBeNull();
  });
});
