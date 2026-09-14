// Local
import { toLoc } from "../../_forms/Localized";

/**
 * Serverdən gələn SiteSetting-i redaktə formasının vəziyyətinə çevirir.
 * Təmiz funksiyadır — vəziyyət özü səhifədə qalır.
 */
export function settingsToForm(s) {
  return {
    brand: {
      name: s.brand?.name || "",
      logo: s.brand?.logo || "",
      shield: s.brand?.shield || "",
      badge: s.brand?.badge || "",
      favicon: s.brand?.favicon || "",
      ogImage: s.brand?.ogImage || "",
      themeColor: s.brand?.themeColor || "#00157A",
    },
    contact: {
      ...s.contact,
      // Ünvan və iş saatları çoxdillidir — hər səhifədə görünürlər.
      address: toLoc(s.contact?.address),
      hours: toLoc(s.contact?.hours),
    },
    socials: { ...s.socials },
    smtp: {
      enabled: Boolean(s.smtp?.enabled),
      host: s.smtp?.host || "",
      port: s.smtp?.port ?? 587,
      secure: Boolean(s.smtp?.secure),
      user: s.smtp?.user || "",
      fromName: s.smtp?.fromName || "",
      fromEmail: s.smtp?.fromEmail || "",
      notifyLeads: s.smtp?.notifyLeads !== false,
      notifyEmail: s.smtp?.notifyEmail || "",
      pass: "", // yalnız-yazma; boş = köhnəni saxla
      hasPass: Boolean(s.smtp?.hasPass),
    },
    ai: {
      enabled: Boolean(s.ai?.enabled),
      model: s.ai?.model || "openai/gpt-4o-mini",
      apiKey: "", // yalnız-yazma; boş = köhnəni saxla
      hasKey: Boolean(s.ai?.hasKey),
    },
    codeInjection: {
      head: s.codeInjection?.head || "",
      bodyEnd: s.codeInjection?.bodyEnd || "",
      gtmId: s.codeInjection?.gtmId || "",
    },
    robotsTxt: s.robotsTxt || "",
    maxImageSizeKb: s.maxImageSizeKb || 500,
    seo: {
      titleTemplate: s.seo?.titleTemplate || "",
      defaultTitle: toLoc(s.seo?.defaultTitle),
      defaultDescription: toLoc(s.seo?.defaultDescription),
      defaultOgImage: s.seo?.defaultOgImage || "",
      twitterHandle: s.seo?.twitterHandle || "",
      keywords: toLoc(s.seo?.keywords),
      verification: {
        google: s.seo?.verification?.google || "",
        yandex: s.seo?.verification?.yandex || "",
        bing: s.seo?.verification?.bing || "",
      },
    },
  };
}
