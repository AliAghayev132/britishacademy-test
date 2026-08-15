"use client";

// React
import { useEffect, useState } from "react";
// UI / kit
import { notify } from "@/components/ui/feedback";
// Data (RTK Query)
import {
  useAdminGetSettingsQuery,
  useAdminUpdateSettingsMutation,
  useAdminTestMailMutation,
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
  const [testMail, { isLoading: testing }] = useAdminTestMailMutation();
  const [form, setForm] = useState(null);
  const [testTo, setTestTo] = useState("");

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
        smtp: {
          enabled: Boolean(s.smtp?.enabled),
          host: s.smtp?.host || "",
          port: s.smtp?.port ?? 587,
          secure: Boolean(s.smtp?.secure),
          user: s.smtp?.user || "",
          fromName: s.smtp?.fromName || "",
          fromEmail: s.smtp?.fromEmail || "",
          pass: "", // yalnız-yazma; boş = köhnəni saxla
          hasPass: Boolean(s.smtp?.hasPass),
        },
        codeInjection: { head: s.codeInjection?.head || "", bodyEnd: s.codeInjection?.bodyEnd || "" },
        robotsTxt: s.robotsTxt || "",
        maxImageSizeKb: s.maxImageSizeKb || 500,
        seo: {
          titleTemplate: s.seo?.titleTemplate || "",
          defaultTitle: s.seo?.defaultTitle || "",
          defaultDescription: s.seo?.defaultDescription || "",
          defaultOgImage: s.seo?.defaultOgImage || "",
          twitterHandle: s.seo?.twitterHandle || "",
          keywords: (s.seo?.keywords || []).join(", "),
          verification: {
            google: s.seo?.verification?.google || "",
            yandex: s.seo?.verification?.yandex || "",
            bing: s.seo?.verification?.bing || "",
          },
        },
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
      notify.error("Statistika JSON düzgün deyil");
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
        seo: {
          ...form.seo,
          keywords: csv(form.seo.keywords),
          verification: { ...form.seo.verification },
        },
        smtp: {
          enabled: Boolean(form.smtp.enabled),
          host: form.smtp.host.trim(),
          port: Number(form.smtp.port) || 587,
          secure: Boolean(form.smtp.secure),
          user: form.smtp.user.trim(),
          fromName: form.smtp.fromName.trim(),
          fromEmail: form.smtp.fromEmail.trim(),
          pass: form.smtp.pass, // boşdursa backend köhnəni saxlayır
        },
      }).unwrap();
      notify.success("Yadda saxlanıldı");
    } catch (err) {
      notify.error(err?.data?.message || "Yadda saxlanmadı");
    }
  };

  const sendTest = async () => {
    const to = testTo.trim();
    if (!to) return notify.error("Test üçün email ünvanı yazın");
    try {
      const res = await testMail(to).unwrap();
      notify.success(res?.message || "Test məktubu göndərildi");
    } catch (err) {
      notify.error(err?.data?.message || "Göndərilmədi — əvvəlcə SMTP-ni yadda saxlayın");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end">
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

      <Section title="SEO (qlobal)">
        <div>
          <label className={label}>Başlıq şablonu</label>
          <input className={input} placeholder="%s — British Academy" value={form.seo.titleTemplate} onChange={(e) => set("seo.titleTemplate", e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">%s başlıq yerinə keçir, məs. &quot;%s — British Academy&quot;</p>
        </div>
        <div>
          <label className={label}>Default başlıq</label>
          <input className={input} value={form.seo.defaultTitle} onChange={(e) => set("seo.defaultTitle", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Default təsvir</label>
          <textarea rows={3} className={input} value={form.seo.defaultDescription} onChange={(e) => set("seo.defaultDescription", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Açar sözlər (vergüllə)</label>
          <input className={input} value={form.seo.keywords} onChange={(e) => set("seo.keywords", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Default OG şəkil (URL)</label>
          <input className={input} value={form.seo.defaultOgImage} onChange={(e) => set("seo.defaultOgImage", e.target.value)} />
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

      <Section title="SMTP (email göndərişi)">
        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="smtp-enabled" type="checkbox" checked={form.smtp.enabled} onChange={(e) => set("smtp.enabled", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="smtp-enabled" className="text-sm font-medium text-gray-700">SMTP aktiv (email göndərişi üçün)</label>
        </div>
        <div>
          <label className={label}>Host</label>
          <input className={input} placeholder="smtp.gmail.com" value={form.smtp.host} onChange={(e) => set("smtp.host", e.target.value)} />
        </div>
        <div>
          <label className={label}>Port</label>
          <input type="number" className={input} placeholder="587" value={form.smtp.port} onChange={(e) => set("smtp.port", e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="smtp-secure" type="checkbox" checked={form.smtp.secure} onChange={(e) => set("smtp.secure", e.target.checked)} className="h-4 w-4" />
          <label htmlFor="smtp-secure" className="text-sm font-medium text-gray-700">Secure (SSL — port 465)</label>
        </div>
        <div>
          <label className={label}>İstifadəçi (user)</label>
          <input className={input} placeholder="mail@domain.com" value={form.smtp.user} onChange={(e) => set("smtp.user", e.target.value)} />
        </div>
        <div>
          <label className={label}>Parol {form.smtp.hasPass && <span className="text-emerald-600">(təyin olunub)</span>}</label>
          <input type="password" autoComplete="new-password" className={input} placeholder={form.smtp.hasPass ? "•••••••• (dəyişmək üçün yaz)" : "SMTP parolu"} value={form.smtp.pass} onChange={(e) => set("smtp.pass", e.target.value)} />
        </div>
        <div>
          <label className={label}>Göndərən adı (from name)</label>
          <input className={input} placeholder="British Academy" value={form.smtp.fromName} onChange={(e) => set("smtp.fromName", e.target.value)} />
        </div>
        <div>
          <label className={label}>Göndərən email (from)</label>
          <input className={input} placeholder="info@britishacademy.az" value={form.smtp.fromEmail} onChange={(e) => set("smtp.fromEmail", e.target.value)} />
        </div>
        <div className="sm:col-span-2 rounded-lg bg-gray-50 p-3">
          <label className={label}>Test məktubu göndər</label>
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${input} max-w-xs`} placeholder="test@ünvan.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button onClick={sendTest} disabled={testing} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {testing ? "Göndərilir…" : "Test göndər"}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Əvvəlcə SMTP-ni yadda saxlayın, sonra test göndərin.</p>
        </div>
      </Section>
    </div>
  );
}
