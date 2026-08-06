"use client";

// ── SEO fields ──
// Reusable SEO editor shared by the bespoke admin forms. Not a modal — render it
// inside a form's <Overlay> body. Reads/writes a single `seo` object:
//   { metaTitle, metaDescription, keywords (array), ogImage, canonical, noindex }
// Keywords are stored as an array but edited as a comma-separated string.

// Local
import { SectionTitle, Field, TextInput, TextArea, Toggle } from "./kit";
import { FileUpload } from "@/components/ui/FileUpload";

export function SeoFields({ value = {}, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  const keywords = Array.isArray(value.keywords) ? value.keywords : [];
  const setKeywords = (csv) =>
    set(
      "keywords",
      csv
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    );

  return (
    <section className="space-y-4">
      <SectionTitle>SEO</SectionTitle>
      <Field label="Meta başlıq" info="Boş qalsa avtomatik başlıq işlənir">
        <TextInput
          value={value.metaTitle || ""}
          onChange={(e) => set("metaTitle", e.target.value)}
        />
      </Field>
      <Field label="Meta təsvir">
        <TextArea
          rows={3}
          value={value.metaDescription || ""}
          onChange={(e) => set("metaDescription", e.target.value)}
        />
      </Field>
      <Field label="Açar sözlər" info="Vergüllə ayır, məs: IELTS, təhsil, viza">
        <TextInput
          value={keywords.join(", ")}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="IELTS, təhsil, viza"
        />
      </Field>
      <Field label="OG şəkil" info="Paylaşımlarda görünən şəkil (1200×630)">
        <FileUpload
          value={value.ogImage}
          onChange={(url) => set("ogImage", url)}
          kind="image"
        />
      </Field>
      <Field label="Canonical URL" info="Yalnız xüsusi hal üçün; boş qoy">
        <TextInput
          value={value.canonical || ""}
          onChange={(e) => set("canonical", e.target.value)}
          placeholder="https://…"
        />
      </Field>
      <Toggle
        checked={Boolean(value.noindex)}
        onChange={(v) => set("noindex", v)}
        label="Axtarış sistemlərindən gizlə"
      />
    </section>
  );
}
