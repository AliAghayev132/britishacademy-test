"use client";

// ── SEO fields ──
// Reusable SEO editor shared by the bespoke admin forms. Not a modal — render it
// inside a form's <Overlay> body. Reads/writes a single `seo` object:
//   { metaTitle, metaDescription, keywords, ogImage, canonical, noindex }
// metaTitle / metaDescription / keywords 3 dillidir ({ az, en, ru }) — aktiv dil
// modalın yuxarısındakı qlobal düymə ilə seçilir, AI düymələri də oradan işləyir.
// keywords hər dil üçün vergüllə ayrılmış mətndir.

// Local
import { SectionTitle, Field, TextInput, Toggle } from "./kit";
import { LocalizedInput } from "./Localized";
import { FileUpload } from "@/components/ui/FileUpload";

export function SeoFields({ value = {}, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  return (
    <section className="space-y-4">
      <SectionTitle>SEO</SectionTitle>
      <Field label="Meta başlıq" info="3 dildə — boş qalsa avtomatik başlıq işlənir">
        <LocalizedInput
          value={value.metaTitle}
          onChange={(v) => set("metaTitle", v)}
        />
      </Field>
      <Field label="Meta təsvir" info="3 dildə — axtarış nəticəsində görünən mətn">
        <LocalizedInput
          value={value.metaDescription}
          onChange={(v) => set("metaDescription", v)}
          multiline
          rows={3}
        />
      </Field>
      <Field label="Açar sözlər" info="3 dildə — vergüllə ayır, məs: IELTS, təhsil, viza">
        <LocalizedInput
          value={value.keywords}
          onChange={(v) => set("keywords", v)}
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
