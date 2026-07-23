"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  useAdminGetSettingsQuery,
  useAdminUpdateSettingsMutation,
} from "@/store/api/adminApi";

const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

// Defined OUTSIDE the page component — otherwise React remounts the subtree on
// every keystroke and inputs lose focus.
const Section = ({ title, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5">
    <h2 className="mb-4 text-sm font-bold text-gray-900">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

/**
 * Site settings editor. Covers the client brief's admin requirements:
 * contact/socials, hero words+colors, stats, head/body code injection and the
 * robots.txt body — all persisted on the SiteSetting singleton.
 */
export default function SettingsPage() {
  const { data, isLoading } = useAdminGetSettingsQuery();
  const [update, { isLoading: saving }] = useAdminUpdateSettingsMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const s = data?.data?.settings;
    if (s && !form) {
      setForm({
        contact: { ...s.contact },
        socials: { ...s.socials },
        hero: {
          titlePrefix: s.hero?.titlePrefix || "",
          subtitle: s.hero?.subtitle || "",
          words: (s.hero?.words || []).join(", "),
          colors: (s.hero?.colors || []).join(", "),
        },
        stats: JSON.stringify(s.stats || [], null, 2),
        marquee: (s.marquee || []).join(", "),
        codeInjection: { head: s.codeInjection?.head || "", bodyEnd: s.codeInjection?.bodyEnd || "" },
        robotsTxt: s.robotsTxt || "",
        maxImageSizeKb: s.maxImageSizeKb || 500,
      });
    }
  }, [data, form]);

  if (isLoading || !form) return <div className="p-8 text-sm text-gray-500">Yüklənir…</div>;

  const set = (path, value) => {
    setForm((f) => {
      const next = structuredClone(f);
      const keys = path.split(".");
      let o = next;
      while (keys.length > 1) o = o[keys.shift()];
      o[keys[0]] = value;
      return next;
    });
  };

  const save = async () => {
    let stats;
    try {
      stats = JSON.parse(form.stats);
    } catch {
      Swal.fire({ icon: "error", title: "Statistika JSON düzgün deyil" });
      return;
    }
    const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
    try {
      await update({
        contact: form.contact,
        socials: form.socials,
        hero: {
          titlePrefix: form.hero.titlePrefix,
          subtitle: form.hero.subtitle,
          words: csv(form.hero.words),
          colors: csv(form.hero.colors),
        },
        stats,
        marquee: csv(form.marquee),
        codeInjection: form.codeInjection,
        robotsTxt: form.robotsTxt,
        maxImageSizeKb: Number(form.maxImageSizeKb) || 500,
      }).unwrap();
      Swal.fire({ icon: "success", title: "Yadda saxlanıldı", timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err?.data?.message || "Yadda saxlanmadı" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Sayt tənzimləmələri</h1>
        <button onClick={save} disabled={saving} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {saving ? "Saxlanılır…" : "Yadda saxla"}
        </button>
      </div>

      <Section title="Əlaqə">
        {["phone", "phone2", "email", "address", "hours"].map((k) => (
          <div key={k}>
            <label className={label}>{{ phone: "Telefon", phone2: "Telefon 2", email: "E-poçt", address: "Ünvan", hours: "İş saatları" }[k]}</label>
            <input className={input} value={form.contact?.[k] || ""} onChange={(e) => set(`contact.${k}`, e.target.value)} />
          </div>
        ))}
      </Section>

      <Section title="Sosial şəbəkələr">
        {["instagram", "facebook", "youtube", "whatsapp", "tiktok"].map((k) => (
          <div key={k}>
            <label className={label}>{k}</label>
            <input className={input} value={form.socials?.[k] || ""} onChange={(e) => set(`socials.${k}`, e.target.value)} />
          </div>
        ))}
      </Section>

      <Section title="Ana səhifə hero">
        <div>
          <label className={label}>Başlıq prefiksi</label>
          <input className={input} value={form.hero.titlePrefix} onChange={(e) => set("hero.titlePrefix", e.target.value)} />
        </div>
        <div>
          <label className={label}>Alt yazı</label>
          <input className={input} value={form.hero.subtitle} onChange={(e) => set("hero.subtitle", e.target.value)} />
        </div>
        <div>
          <label className={label}>Fırlanan sözlər (vergüllə)</label>
          <input className={input} value={form.hero.words} onChange={(e) => set("hero.words", e.target.value)} />
        </div>
        <div>
          <label className={label}>Rənglər (vergüllə, hex)</label>
          <input className={input} value={form.hero.colors} onChange={(e) => set("hero.colors", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Marquee sözləri (vergüllə)</label>
          <input className={input} value={form.marquee} onChange={(e) => set("marquee", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Statistika (JSON: [{"{"}"label","value"{"}"}])</label>
          <textarea rows={5} spellCheck={false} className={`${input} font-mono text-xs`} value={form.stats} onChange={(e) => set("stats", e.target.value)} />
        </div>
      </Section>

      <Section title="SEO / Texniki (PDF tələbləri)">
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
    </div>
  );
}
