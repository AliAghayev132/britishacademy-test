"use client";

// Local
import { Section, input, label } from "./shared";

/** GTM, head/body kodu, robots.txt və şəkil limiti — «SEO / Texniki» tabının ikinci bölməsi. */
export function CodeInjectionSection({ form, set }) {
  return (
    <Section title="SEO / Texniki (PDF tələbləri)">
      <div className="sm:col-span-2">
        <label className={label}>Google Tag Manager ID</label>
        <input
          className={`${input} font-mono`}
          placeholder="GTM-XXXXXXX"
          value={form.codeInjection.gtmId}
          onChange={(e) => set("codeInjection.gtmId", e.target.value)}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Yalnız ID yazın — kodun özünü yapışdırmaq lazım deyil. Boş qalsa GTM
          ümumiyyətlə yüklənmir. GTM-in <b>hər iki</b> hissəsi (skript və
          noscript) düzgün yerdə avtomatik qoyulur.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>&lt;head&gt; kodu (analytics, pixel və s.)</label>
        <textarea rows={4} spellCheck={false} className={`${input} font-mono text-xs`} value={form.codeInjection.head} onChange={(e) => set("codeInjection.head", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>&lt;/body&gt; öncəsi kod</label>
        <textarea rows={3} spellCheck={false} className={`${input} font-mono text-xs`} value={form.codeInjection.bodyEnd} onChange={(e) => set("codeInjection.bodyEnd", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>robots.txt məzmunu</label>
        <textarea rows={5} spellCheck={false} className={`${input} font-mono text-xs`} value={form.robotsTxt} onChange={(e) => set("robotsTxt", e.target.value)} />
      </div>
      <div>
        <label className={label}>Maks. şəkil ölçüsü (KB)</label>
        <input type="number" className={input} value={form.maxImageSizeKb} onChange={(e) => set("maxImageSizeKb", e.target.value)} />
      </div>
    </Section>
  );
}
