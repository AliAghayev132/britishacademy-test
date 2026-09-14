"use client";

// Components
import { FileUpload } from "@/components";

// Lib
import { IMAGE_SPECS } from "@/lib";

// Local
import { LocalizedInput } from "../../_forms/Localized";
import { CodeInjectionSection } from "./CodeInjectionSection";
import { Section, input, label } from "./shared";

/** «SEO / Texniki» tabı — qlobal SEO sahələri + kod yerləşdirmə. */
export function SeoTab({ form, set }) {
  return (
    <>
      <Section title="SEO (qlobal)">
        <div>
          <label className={label}>Başlıq şablonu</label>
          <input className={input} placeholder="%s — British Academy" value={form.seo.titleTemplate} onChange={(e) => set("seo.titleTemplate", e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">%s başlıq yerinə keçir, məs. &quot;%s — British Academy&quot;</p>
        </div>
        <div>
          <label className={label}>Default başlıq (3 dildə)</label>
          <LocalizedInput value={form.seo.defaultTitle} onChange={(v) => set("seo.defaultTitle", v)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Default təsvir (3 dildə)</label>
          <LocalizedInput value={form.seo.defaultDescription} onChange={(v) => set("seo.defaultDescription", v)} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Açar sözlər — vergüllə (3 dildə)</label>
          <LocalizedInput value={form.seo.keywords} onChange={(v) => set("seo.keywords", v)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Default OG şəkil (URL)</label>
          <FileUpload
            value={form.seo.defaultOgImage}
            onChange={(url) => set("seo.defaultOgImage", url)}
            kind="image"
            spec={IMAGE_SPECS.ogImage}
          />
        </div>
        <div>
          <label className={label}>Twitter handle</label>
          <input className={input} placeholder="@britishacademy" value={form.seo.twitterHandle} onChange={(e) => set("seo.twitterHandle", e.target.value)} />
        </div>
        <div>
          <label className={label}>Google doğrulama kodu</label>
          <input className={input} value={form.seo.verification.google} onChange={(e) => set("seo.verification.google", e.target.value)} />
        </div>
        <div>
          <label className={label}>Yandex doğrulama</label>
          <input className={input} value={form.seo.verification.yandex} onChange={(e) => set("seo.verification.yandex", e.target.value)} />
        </div>
        <div>
          <label className={label}>Bing doğrulama</label>
          <input className={input} value={form.seo.verification.bing} onChange={(e) => set("seo.verification.bing", e.target.value)} />
        </div>
      </Section>

      <CodeInjectionSection form={form} set={set} />
    </>
  );
}
