"use client";

// Components
import { ColorInput, FileUpload } from "@/components";

// Lib
import { IMAGE_SPECS } from "@/lib";

// Local
import { Section, input, label } from "./shared";

/** «Brend» tabı — loqolar, nişanlar, tema rəngi. */
export function BrandTab({ form, set }) {
  return (
    <Section title="Loqolar və nişanlar">
      <div className="sm:col-span-2">
        <label className={label}>Brend adı</label>
        <input className={input} value={form.brand.name} onChange={(e) => set("brand.name", e.target.value)} />
      </div>
      <div>
        <label className={label}>Loqo (üfüqi)</label>
        <FileUpload value={form.brand.logo} onChange={(u) => set("brand.logo", u)} kind="image" spec={IMAGE_SPECS.brandLogo} />
      </div>
      <div>
        <label className={label}>Qalxan nişanı</label>
        <FileUpload value={form.brand.shield} onChange={(u) => set("brand.shield", u)} kind="image" spec={IMAGE_SPECS.brandShield} />
      </div>
      <div>
        <label className={label}>Yubiley nişanı</label>
        <FileUpload value={form.brand.badge} onChange={(u) => set("brand.badge", u)} kind="image" spec={IMAGE_SPECS.brandBadge} />
      </div>
      <div>
        <label className={label}>Favicon</label>
        <FileUpload value={form.brand.favicon} onChange={(u) => set("brand.favicon", u)} kind="image" spec={IMAGE_SPECS.favicon} />
      </div>
      <div>
        <label className={label}>Paylaşım şəkli (OG)</label>
        <FileUpload value={form.brand.ogImage} onChange={(u) => set("brand.ogImage", u)} kind="image" spec={IMAGE_SPECS.ogImage} />
      </div>
      <div>
        <label className={label}>Tema rəngi</label>
        <ColorInput
          value={form.brand.themeColor}
          onChange={(e) => set("brand.themeColor", e.target.value)}
          className="h-10 w-full"
        />
        <p className="mt-1 text-xs text-gray-400">Mobil brauzerin ünvan zolağının rəngi.</p>
      </div>
    </Section>
  );
}
