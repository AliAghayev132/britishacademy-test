import { describe, it, expect } from "vitest";
import { normalizeRecipients, renderTemplate, resolveDelaySec, DELAY_LIMITS } from "#services";

// Toplu göndəriş real insanlara mesaj yollayır — səhv nömrə formatı və ya
// təkrarlanan sətir birbaşa istifadəçiyə çatan xətadır. Bu testlər həmin
// filtrin işlədiyini təsbit edir.

describe("renderTemplate", () => {
  it("dəyişənləri əvəz edir", () => {
    expect(renderTemplate("Salam {{ad}}!", { ad: "Aysel" })).toBe("Salam Aysel!");
  });

  it("boşluqlu yazılışı da tanıyır", () => {
    expect(renderTemplate("Salam {{ ad }}", { ad: "Nihat" })).toBe("Salam Nihat");
  });

  it("çatışmayan dəyişəni boş buraxır — «undefined» yazmır", () => {
    expect(renderTemplate("Salam {{ad}}!", {})).toBe("Salam !");
    expect(renderTemplate("Salam {{ad}}!", { ad: null })).toBe("Salam !");
  });

  it("şablon boş olanda çökmür", () => {
    expect(renderTemplate(null, {})).toBe("");
    expect(renderTemplate(undefined, { a: 1 })).toBe("");
  });
});

describe("normalizeRecipients — WhatsApp", () => {
  it("etibarlı nömrələri qəbul edir", () => {
    const { valid } = normalizeRecipients(
      [{ value: "+994501234567" }, { value: "0559876543" }],
      "whatsapp",
    );
    expect(valid.length).toBeGreaterThan(0);
  });

  it("təkrarları sayır və bir dəfə saxlayır", () => {
    const { valid, duplicates } = normalizeRecipients(
      [{ value: "+994501234567" }, { value: "+994501234567" }],
      "whatsapp",
    );
    expect(valid).toHaveLength(1);
    expect(duplicates).toBe(1);
  });

  it("yararsız dəyərləri ayırır", () => {
    const { invalid } = normalizeRecipients(
      [{ value: "salam" }, { value: "" }, { value: "12" }],
      "whatsapp",
    );
    expect(invalid.length).toBeGreaterThan(0);
  });

  it("boş siyahıda çökmür", () => {
    const r = normalizeRecipients([], "whatsapp");
    expect(r.valid).toEqual([]);
    expect(r.invalid).toEqual([]);
    expect(r.duplicates).toBe(0);
  });

  it("undefined arqumentlə çökmür", () => {
    const r = normalizeRecipients(undefined, "whatsapp");
    expect(r.valid).toEqual([]);
  });
});

describe("normalizeRecipients — e-poçt", () => {
  it("etibarlı ünvanı qəbul edir", () => {
    const { valid } = normalizeRecipients([{ value: "a@b.com" }], "email");
    expect(valid).toHaveLength(1);
  });

  it("səhv ünvanı rədd edir", () => {
    const { invalid } = normalizeRecipients(
      [{ value: "a@b" }, { value: "salam" }, { value: "@b.com" }],
      "email",
    );
    expect(invalid.length).toBe(3);
  });

  it("böyük/kiçik hərf təkrarını tutur", () => {
    const { valid, duplicates } = normalizeRecipients(
      [{ value: "A@B.com" }, { value: "a@b.com" }],
      "email",
    );
    expect(valid).toHaveLength(1);
    expect(duplicates).toBe(1);
  });
});

describe("resolveDelaySec — mesajlar arası fasilə", () => {
  it("boş və ya yanlış dəyərdə kanalın defoltunu verir", () => {
    // Fasilə əvvəl sabit idi (WhatsApp 4–9 san). Admin onu indi özü seçir,
    // amma boş qoya da bilər — o zaman kanal üçün ağlabatan defolt işləyir.
    expect(resolveDelaySec("whatsapp", undefined)).toBe(DELAY_LIMITS.whatsapp.def);
    expect(resolveDelaySec("whatsapp", "")).toBe(DELAY_LIMITS.whatsapp.def);
    expect(resolveDelaySec("whatsapp", "abc")).toBe(DELAY_LIMITS.whatsapp.def);
    expect(resolveDelaySec("email", null)).toBe(DELAY_LIMITS.email.def);
  });

  it("həddən kənar dəyəri sıxır", () => {
    // 0 saniyə WhatsApp-da nömrənin bloklanması deməkdir; sonsuz böyük dəyər
    // isə göndərişi əbədi asardı. Hər ikisi açıq endpointdən gələ bilər.
    expect(resolveDelaySec("whatsapp", 0)).toBe(DELAY_LIMITS.whatsapp.min);
    expect(resolveDelaySec("whatsapp", -50)).toBe(DELAY_LIMITS.whatsapp.min);
    expect(resolveDelaySec("whatsapp", 99999)).toBe(DELAY_LIMITS.whatsapp.max);
  });

  it("aralıqdakı dəyəri olduğu kimi saxlayır", () => {
    expect(resolveDelaySec("whatsapp", 6)).toBe(6);
    expect(resolveDelaySec("whatsapp", 30)).toBe(30);
    expect(resolveDelaySec("email", 1.5)).toBe(1.5);
  });

  it("naməlum kanalda WhatsApp həddlərinə düşür", () => {
    // Ehtiyatlı tərəf: naməlum kanal üçün DAHA UZUN fasilə seçilir.
    expect(resolveDelaySec("sms", undefined)).toBe(DELAY_LIMITS.whatsapp.def);
  });

  it("e-poçt WhatsApp-dan sürətli, amma sıfır deyil", () => {
    expect(DELAY_LIMITS.email.def).toBeLessThan(DELAY_LIMITS.whatsapp.def);
    expect(DELAY_LIMITS.email.min).toBeGreaterThan(0);
  });
});
