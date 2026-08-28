import { describe, it, expect } from "vitest";
import { normalizeRecipients, renderTemplate } from "#services";

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
