"use client";

// Local
import { LocalizedInput } from "../../_forms/Localized";
import { Section, input, label } from "./shared";

/** «Əlaqə» tabı — telefonlar, ünvan, iş saatları və sosial şəbəkələr. */
export function ContactTab({ form, set }) {
  return (
    <>
      <Section title="Əlaqə">
        {["phone", "phone2", "email"].map((k) => (
          <div key={k}>
            <label className={label}>{{ phone: "Telefon", phone2: "Telefon 2", email: "E-poçt" }[k]}</label>
            <input className={input} value={form.contact?.[k] || ""} onChange={(e) => set(`contact.${k}`, e.target.value)} />
          </div>
        ))}
        {/* Ünvan və iş saatları 3 dildədir — header-in üst lentində,
            footer-də və «Əlaqə» səhifəsində, yəni bütün saytda görünürlər. */}
        <div>
          <label className={label}>Ünvan <span className="text-gray-400">· 3 dildə</span></label>
          <LocalizedInput value={form.contact.address} onChange={(v) => set("contact.address", v)} />
        </div>
        <div>
          <label className={label}>İş saatları <span className="text-gray-400">· 3 dildə</span></label>
          <LocalizedInput value={form.contact.hours} onChange={(v) => set("contact.hours", v)} />
        </div>
      </Section>

      <Section title="Sosial şəbəkələr">
        {["instagram", "facebook", "youtube", "whatsapp", "tiktok"].map((k) => (
          <div key={k}>
            <label className={label}>{k}</label>
            <input className={input} value={form.socials?.[k] || ""} onChange={(e) => set(`socials.${k}`, e.target.value)} />
          </div>
        ))}
      </Section>
    </>
  );
}
