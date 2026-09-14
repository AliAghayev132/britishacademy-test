"use client";

// Local
import { LocalizedInput } from "../../_forms/Localized";
import { PillLinksEditor } from "./PillLinksEditor";
import { input, label } from "./shared";

/** «Hero» tabı — başlıq, sözlər, həblər, rənglər. */
export function HeroPanel({ form, set }) {
  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
      <div>
        <label className={label}>Başlıq prefiksi (3 dildə)</label>
        <LocalizedInput value={form.hero.titlePrefix} onChange={(v) => set("hero.titlePrefix", v)} />
      </div>
      <div>
        <label className={label}>Alt yazı (3 dildə)</label>
        <LocalizedInput value={form.hero.subtitle} onChange={(v) => set("hero.subtitle", v)} />
      </div>
      <div>
        <label className={label}>Fırlanan sözlər — vergüllə (3 dildə)</label>
        <LocalizedInput value={form.hero.words} onChange={(v) => set("hero.words", v)} />
      </div>
      <div>
        <label className={label}>Rənglər (vergüllə, hex)</label>
        <input className={input} value={form.hero.colors} onChange={(e) => set("hero.colors", e.target.value)} />
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:col-span-2">
        <p className="mb-3 text-xs text-gray-500">
          Hero-nun <b>solunda və sağında</b> üzən sözlər. Hər səhifə açılışında
          siyahıdan <b>təsadüfi 3-ü</b> seçilir — sol və sağ müstəqil şəkildə.
          Boş buraxsanız hazır dəyərlər işlənir.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Sol tərəf — vergüllə (3 dildə)</label>
            <LocalizedInput
              value={form.hero.chipsLeft}
              onChange={(v) => set("hero.chipsLeft", v)}
              placeholder="Speaking, IELTS 8.5, Hallo"
            />
          </div>
          <div>
            <label className={label}>Sağ tərəf — vergüllə (3 dildə)</label>
            <LocalizedInput
              value={form.hero.chipsRight}
              onChange={(v) => set("hero.chipsRight", v)}
              placeholder="Привет, A1 → C1, Konfrans"
            />
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={label}>Kateqoriya həbləri — vergüllə (3 dildə)</label>
        <LocalizedInput
          value={form.hero.pills}
          onChange={(v) => set("hero.pills", v)}
          placeholder="İngilis dili, IELTS, Duolingo, Rus dili"
        />
        <p className="mt-1 text-xs text-gray-400">
          Aşağıdakı «linkli düymələr» siyahısı doldurulubsa BU sahə
          işlədilmir — yalnız köhnə (linksiz) davranış üçün qalıb.
        </p>
      </div>

      {/* Linkli düymələr */}
      <PillLinksEditor form={form} set={set} />
    </div>
  );
}
