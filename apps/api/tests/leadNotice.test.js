import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import { MailService } from "../services/MailService.js";

/**
 * YENİ MÜRACİƏT BİLDİRİŞİ.
 *
 * Əvvəl müraciət yalnız bazaya düşürdü — kimsə admin paneli açmayana qədər
 * onun gəldiyi bilinmirdi. İndi SMTP hesabı ÖZÜNƏ məktub atır.
 *
 * Testlər `send`-i əvəzləyir: real SMTP bağlantısı qurulmur, amma ÜNVANIN
 * necə seçildiyi və məktubun məzmunu tam yoxlanılır.
 */

const cfg = (over = {}) => ({
  host: "smtp.example.com", port: 587, secure: false,
  user: "hesab@britishacademy.az", pass: "x",
  fromName: "British Academy", fromEmail: "info@britishacademy.az",
  enabled: true, notifyLeads: true, notifyEmail: "",
  ...over,
});

/** `send`-i tut, göndərilən məktubu qaytar. */
function capture(config) {
  vi.spyOn(MailService, "resolveConfig").mockResolvedValue(config);
  const sent = [];
  vi.spyOn(MailService, "send").mockImplementation(async (msg) => {
    sent.push(msg);
    return { success: true };
  });
  return sent;
}

const LEAD = {
  name: "Aygün Məmmədova",
  phone: "+994 55 123 45 67",
  email: "aygun@example.com",
  interest: "Xaricdə təhsil",
  course: { title: { az: "IELTS hazırlığı" } },
  branch: { name: { az: "Mərkəz" } },
  destinations: [{ country: { az: "Almaniya" } }, { country: { az: "Polşa" } }],
  message: "Qiymət barədə məlumat istəyirəm",
  source: "apply-modal",
};

afterEach(() => vi.restoreAllMocks());

describe("bildiriş ünvanı", () => {
  it("boş `notifyEmail` → SMTP-nin ÖZ ünvanına gedir", async () => {
    // İstəyin özü budur: «müraciət elədi, həmin smtp-dəki mail özünə atsın».
    const sent = capture(cfg());
    await MailService.sendLeadNotice(LEAD);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("info@britishacademy.az");
  });

  it("`fromEmail` boşdursa SMTP istifadəçisinə düşür", async () => {
    const sent = capture(cfg({ fromEmail: "" }));
    await MailService.sendLeadNotice(LEAD);
    expect(sent[0].to).toBe("hesab@britishacademy.az");
  });

  it("`notifyEmail` verilibsə ora gedir", async () => {
    const sent = capture(cfg({ notifyEmail: "satis@britishacademy.az, mudir@britishacademy.az" }));
    await MailService.sendLeadNotice(LEAD);
    expect(sent[0].to).toBe("satis@britishacademy.az, mudir@britishacademy.az");
  });

  it("açar söndürülübsə göndərilmir", async () => {
    const sent = capture(cfg({ notifyLeads: false }));
    const r = await MailService.sendLeadNotice(LEAD);
    expect(sent).toHaveLength(0);
    expect(r.success).toBe(false);
  });

  it("SMTP ümumiyyətlə qurulmayıbsa göndərilmir", async () => {
    const sent = capture(cfg({ enabled: false }));
    await MailService.sendLeadNotice(LEAD);
    expect(sent).toHaveLength(0);
  });

  it("ünvan tapılmasa səssizcə dayanır", async () => {
    const sent = capture(cfg({ fromEmail: "", user: "" }));
    const r = await MailService.sendLeadNotice(LEAD);
    expect(sent).toHaveLength(0);
    expect(r.success).toBe(false);
  });
});

describe("məktubun məzmunu", () => {
  it("mövzuda ad və telefon var", async () => {
    // Poçt qutusunda açmadan görünsün deyə.
    const sent = capture(cfg());
    await MailService.sendLeadNotice(LEAD);
    expect(sent[0].subject).toContain("Aygün Məmmədova");
    expect(sent[0].subject).toContain("+994 55 123 45 67");
  });

  it("çoxdilli sahələr AZ variantı ilə düzləşir", async () => {
    // Populate edilmiş sənəd { az, en, ru } obyekti qaytarır — düzləşdirilməsə
    // məktubda «[object Object]» görünərdi.
    const sent = capture(cfg());
    await MailService.sendLeadNotice(LEAD);
    const h = sent[0].html;
    expect(h).toContain("IELTS hazırlığı");
    expect(h).toContain("Mərkəz");
    expect(h).toContain("Almaniya, Polşa");
    expect(h).not.toContain("[object Object]");
  });

  it("boş sahələr cədvələ düşmür", async () => {
    const sent = capture(cfg());
    await MailService.sendLeadNotice({ name: "Ad", phone: "055" });
    expect(sent[0].html).not.toContain("E-poçt");
    expect(sent[0].html).not.toContain("Kurs");
    expect(sent[0].html).toContain("Ad");
  });

  it("ziyarətçinin mətni HTML kimi işlənmir", async () => {
    // `message` AÇIQ formadan gəlir — qaçırılmasa məktuba ixtiyari HTML
    // (və oxuyan poçt klientindən asılı olaraq link/şəkil) yeridilə bilərdi.
    const sent = capture(cfg());
    await MailService.sendLeadNotice({
      name: 'A"B', phone: "055",
      message: "<img src=x onerror=alert(1)> & <b>qalın</b>",
    });
    const h = sent[0].html;
    expect(h).toContain("&lt;img");
    expect(h).toContain("&amp;");
    expect(h).not.toContain("<img src=x");
  });

  it("telefon zəng linkidir", async () => {
    const sent = capture(cfg());
    await MailService.sendLeadNotice(LEAD);
    expect(sent[0].html).toContain('href="tel:+994551234567"');
  });

  it("başlıqda admin yazdığı göndərən adı işlədilir", async () => {
    // `config.siteName` ENV defoltudur — qurulmamış mühitdə «Starter» çıxırdı.
    const sent = capture(cfg({ fromName: "Filan Akademiya" }));
    await MailService.sendLeadNotice(LEAD);
    expect(sent[0].html).toContain("Filan Akademiya");
  });

  it("heç vaxt atmır", async () => {
    // Müraciətin qeydə alınması poçtdan asılı olmamalıdır.
    vi.spyOn(MailService, "resolveConfig").mockRejectedValue(new Error("baza yıxıldı"));
    const r = await MailService.sendLeadNotice(LEAD);
    expect(r.success).toBe(false);
  });
});

describe("controller bağlantısı", () => {
  const src = fs.readFileSync("controllers/leadController.js", "utf8");

  it("bildiriş CAVABDAN SONRA göndərilir", () => {
    // Ziyarətçi SMTP-nin cavabını gözləməməlidir.
    const resAt = src.indexOf("res.status(201)");
    const mailAt = src.indexOf("sendLeadNotice");
    expect(resAt).toBeGreaterThan(0);
    expect(mailAt).toBeGreaterThan(resAt);
  });

  it("poçt xətası müraciəti pozmur", () => {
    expect(src).toMatch(/\.catch\(/);
  });

  it("adlar üçün populate edilir", () => {
    // Onsuz məktuba kurs/filial adı yox, ObjectId düşərdi.
    for (const f of ["course", "branch", "project", "destinations"]) {
      expect(src, `populate yoxdur: ${f}`).toContain(`populate("${f}"`);
    }
  });
});
