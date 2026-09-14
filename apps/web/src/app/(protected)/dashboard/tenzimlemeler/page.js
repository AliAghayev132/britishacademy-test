"use client";

// React
import { useEffect, useState } from "react";

// Components
import { notify, QueryState } from "@/components";

// Store
import {
  useAdminGetSettingsQuery,
  useAdminUpdateSettingsMutation,
  useAdminTestMailMutation,
} from "@/store";

// Utils
import { apiErrorMessage } from "@/utils";

// Local
// Çoxdilli redaktə (modallardakı ilə eyni sistem)
import { LocalizedFormProvider, LocaleSwitcher, GlobalAiBar, trimLoc } from "../_forms/Localized";
import { settingsToForm } from "./_components/settingsToForm";
import { BrandTab } from "./_components/BrandTab";
import { ContactTab } from "./_components/ContactTab";
import { SeoTab } from "./_components/SeoTab";
import { SmtpTab } from "./_components/SmtpTab";
import { AiTab } from "./_components/AiTab";

// Tənzimləmələr tab-ları — hər biri müvafiq bölmələri göstərir. Bütün sahələr
// tək `form` state-də saxlanılır, ona görə "Yadda saxla" hansı tabda olsan da
// hamısını göndərir.
const TABS = [
  { id: "brand", label: "Brend" },
  { id: "contact", label: "Əlaqə" },
  { id: "seo", label: "SEO / Texniki" },
  { id: "smtp", label: "SMTP (email)" },
  { id: "ai", label: "AI (OpenRouter)" },
];

/**
 * Site settings editor. Covers the client brief's admin requirements:
 * contact/socials, hero words+colors, stats, head/body code injection, robots.txt,
 * SMTP email göndərişi və AI (OpenRouter) — hamısı SiteSetting singleton-da.
 *
 * Forma vəziyyəti, yadda saxlama və test məktubu burada qalır; hər tabın UI-ı
 * `_components/` altındadır.
 */
export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminGetSettingsQuery();
  const [update, { isLoading: saving }] = useAdminUpdateSettingsMutation();
  const [testMail, { isLoading: testing }] = useAdminTestMailMutation();
  const [form, setForm] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [tab, setTab] = useState("contact");

  useEffect(() => {
    const s = data?.data?.settings;
    if (s && !form) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tənzimləmələr yüklənəndə forma bir dəfə doldurulur (`!form` şərti təkrarın qarşısını alır)
      setForm(settingsToForm(s));
    }
  }, [data, form]);

  // Xəta halında sonsuz «Yüklənir…» əvəzinə səbəb + yenidən cəhd düyməsi.
  if (isLoading || isError || !form) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <QueryState isLoading={isLoading && !isError} isError={isError} error={error} onRetry={refetch} />
      </div>
    );
  }

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

  // Hero, lent və statistika BU SƏHİFƏDƏN İDARƏ OLUNMUR — onlar
  // «Ana səhifə» bölməsinə köçürülüb. Onları burada saxlamaq təhlükəli idi:
  // köhnə tabdan yadda saxlamaq yeni səhifədəki dəyişiklikləri üstündən
  // yazardı.
  const save = async () => {
    try {
      await update({
        brand: form.brand,
        contact: {
          ...form.contact,
          address: trimLoc(form.contact.address),
          hours: trimLoc(form.contact.hours),
        },
        socials: form.socials,
        codeInjection: form.codeInjection,
        robotsTxt: form.robotsTxt,
        maxImageSizeKb: Number(form.maxImageSizeKb) || 500,
        seo: {
          ...form.seo,
          defaultTitle: trimLoc(form.seo.defaultTitle),
          defaultDescription: trimLoc(form.seo.defaultDescription),
          keywords: trimLoc(form.seo.keywords),
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
          notifyLeads: Boolean(form.smtp.notifyLeads),
          notifyEmail: form.smtp.notifyEmail.trim(),
          pass: form.smtp.pass, // boşdursa backend köhnəni saxlayır
        },
        ai: {
          enabled: Boolean(form.ai.enabled),
          model: form.ai.model.trim() || "openai/gpt-4o-mini",
          apiKey: form.ai.apiKey, // boşdursa backend köhnəni saxlayır
        },
      }).unwrap();
      notify.success("Yadda saxlanıldı");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Yadda saxlanmadı"));
    }
  };

  const sendTest = async () => {
    const to = testTo.trim();
    if (!to) return notify.error("Test üçün email ünvanı yazın");
    try {
      const res = await testMail(to).unwrap();
      notify.success(res?.message || "Test məktubu göndərildi");
    } catch (err) {
      notify.error(apiErrorMessage(err, "Göndərilmədi — əvvəlcə SMTP-ni yadda saxlayın"));
    }
  };

  // Bu tab-larda çoxdilli sahələr var — dil düyməsi yalnız orada göstərilir.
  const hasLocalized = tab === "seo" || tab === "contact";

  return (
    <LocalizedFormProvider>
      <div className="flex flex-col gap-5">
        {/* Tab bar + yadda saxla */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-blue-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="rounded-lg bg-blue-900 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {saving ? "Saxlanılır…" : "Yadda saxla"}
          </button>
        </div>

        {/* Çoxdilli sahələr üçün qlobal dil düyməsi + AI (hamısını tərcümə/səliqələ) */}
        {hasLocalized && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2">
            <LocaleSwitcher />
            <GlobalAiBar />
          </div>
        )}

        {tab === "brand" && <BrandTab form={form} set={set} />}
        {tab === "contact" && <ContactTab form={form} set={set} />}
        {tab === "seo" && <SeoTab form={form} set={set} />}
        {tab === "smtp" && (
          <SmtpTab
            form={form}
            set={set}
            testTo={testTo}
            setTestTo={setTestTo}
            sendTest={sendTest}
            testing={testing}
          />
        )}
        {tab === "ai" && <AiTab form={form} set={set} />}
      </div>
    </LocalizedFormProvider>
  );
}
