// Constants
import { Schema, Model } from "#constants";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";
// Local schemas
import { factSchema } from "./shared.schemas.js";

/**
 * SiteSetting — a single document holding everything global and editable:
 * branding, contact details, homepage hero behaviour, and the SEO hooks the
 * client's technical brief asked for (head/body code injection, robots.txt).
 *
 * Always read through `SiteSetting.get()` — it creates the singleton on first
 * call so the API never has to handle a missing document.
 */
const siteSettingSchema = new Schema(
  {
    // Guarantees there is only ever one settings document.
    key: { type: String, default: "site", unique: true, immutable: true },

    brand: {
      name: { type: String, default: "British Academy" },
      logo: { type: String }, // horizontal lockup (header)
      logoStack: { type: String }, // stacked lockup (footer, loader)
      shield: { type: String }, // shield mark (modal, favicon source)
      badge: { type: String }, // "11 il sizinlə" anniversary emblem
      favicon: { type: String },
      ogImage: { type: String },
      themeColor: { type: String, default: "#00157A" },
    },

    contact: {
      phone: { type: String },
      phone2: { type: String },
      email: { type: String },
      // Ünvan və iş saatları ÇOXDİLLİDİR: onlar header-in üst lentində,
      // footer-də və «Əlaqə» səhifəsində — yəni BÜTÜN səhifələrdə görünür.
      // Adi sətir olduqları müddətdə /en və /ru saytında azərbaycanca
      // qalırdılar («Həftə içi 09:00–21:00 · Şənbə 10:00–16:00»).
      address: localizedField(),
      hours: localizedField(),
    },

    socials: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      whatsapp: { type: String },
      tiktok: { type: String },
    },

    // Homepage hero: rotating words + the brand colour cycle behind them
    hero: {
      titlePrefix: localizedField(),
      words: localizedField(), // vergüllə ayrılmış fırlanan sözlər (dil üzrə)
      colors: { type: [String], default: [] },
      subtitle: localizedField(),
      // Hero-nun SOLUNDA və SAĞINDA üzən şüşə sözlər. Hər səhifə açılışında
      // siyahıdan təsadüfi seçilir — sol və sağ MÜSTƏQİL şəkildə.
      // Vergüllə ayrılmış mətn (dil üzrə). Boşdursa komponentdəki defolt.
      chipsLeft: localizedField(),
      chipsRight: localizedField(),
      // «Ödənişsiz sınaq dərsi» həbindən əvvəlki kateqoriya həbləri.
      // AYRI siyahıdır — təsadüfi qarışdırılmır, sıra qorunur.
      // KÖHNƏ sahə — yalnız etiketlər (vergüllə ayrılmış mətn). Hamısı
      // `#kurslar` lövbərinə gedirdi, yəni linki dəyişmək mümkün deyildi.
      // Aşağıdakı `pillLinks` doldurulubsa BU sahə işlədilmir; boş qalanda
      // köhnə davranış qorunur (geriyə uyğunluq).
      pills: localizedField(),
      /**
       * Hero düymələri — etiket + ünvan.
       *
       * Etiket 3 dildədir, ünvan isə ORTAQDIR: link kanonik yoldur
       * («/kurslar/ielts-kurslari»), dilə görə dəyişmir — `LocaleLink` onu
       * cari dilin slug-ına özü çevirir. Ünvanı hər dildə təkrar yazmaq
       * səhvə açıq olardı.
       */
      pillLinks: {
        type: [
          new Schema(
            {
              label: localizedField(),
              // Daxili yol («/kurslar/…»), lövbər («#kurslar») və ya tam link.
              href: { type: String, trim: true, default: "" },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
    },

    /**
     * Ana səhifə bölmələrinin görünüşü və sırası.
     *
     * Əvvəl bölmələr kodda sabit ardıcıllıqla idi və bir bölməni gizlətmək
     * üçün deploy lazım gəlirdi. İndi admin paneldən idarə olunur.
     *
     * BOŞ massiv = «hamısı göstərilir» (kodakı defolt sıra ilə) — köhnə
     * qurulumlar heç nə itirmir.
     */
    homeSections: {
      type: [
        {
          key: { type: String, required: true },
          enabled: { type: Boolean, default: true },
          _id: false,
        },
      ],
      default: [],
    },

    // "20 000+ məzun" style counters
    stats: { type: [factSchema], default: [] },
    // Scrolling marquee strip
    marquee: localizedField(), // vergüllə ayrılmış (dil üzrə)

    seo: {
      titleTemplate: { type: String, default: "%s — British Academy" },
      defaultTitle: localizedField(),
      defaultDescription: localizedField(),
      defaultOgImage: { type: String },
      keywords: localizedField(), // vergüllə ayrılmış (dil üzrə)
      twitterHandle: { type: String, trim: true }, // @handle for twitter:site
      verification: {
        google: { type: String, trim: true }, // google-site-verification
        yandex: { type: String, trim: true },
        bing: { type: String, trim: true },
      },
    },

    // ---- Client brief: admin-editable technical SEO ----
    // Raw markup injected into <head> and before </body> (analytics, pixels).
    codeInjection: {
      head: { type: String, default: "" },
      bodyEnd: { type: String, default: "" },
    },
    // Served verbatim at /robots.txt
    robotsTxt: { type: String, default: "" },
    // Extra schema.org JSON-LD merged into the Organization block
    organizationSchema: { type: String, default: "" },

    // Max upload size enforced by the media endpoint (client brief: 500 KB)
    maxImageSizeKb: { type: Number, default: 500 },

    // SMTP — admin-editable email göndərişi (ENV fallback). `pass` frontend-ə
    // qaytarılmır (yalnız-yazma); boş göndərilsə köhnə parol saxlanılır.
    smtp: {
      enabled: { type: Boolean, default: false },
      host: { type: String, default: "", trim: true },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false }, // 465 üçün true
      user: { type: String, default: "", trim: true },
      pass: { type: String, default: "" },
      fromName: { type: String, default: "", trim: true },
      fromEmail: { type: String, default: "", trim: true },

      // Yeni müraciət gələndə bildiriş məktubu göndərilsin.
      //
      // Əvvəl müraciət yalnız bazaya düşürdü — kimsə admin paneli açmayana
      // qədər onun gəldiyi bilinmirdi. İndi SMTP hesabı ÖZÜNƏ məktub atır.
      notifyLeads: { type: Boolean, default: true },
      // Boş qalsa bildiriş SMTP-nin öz ünvanına (fromEmail / user) gedir.
      // Vergüllə bir neçə ünvan yazmaq olar.
      notifyEmail: { type: String, default: "", trim: true },
    },

    // AI (OpenRouter) — admin panelindəki tərcümə/səliqə köməkçisi üçün.
    // `apiKey` frontend-ə qaytarılmır (yalnız-yazma).
    ai: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: "" },
      model: { type: String, default: "openai/gpt-4o-mini", trim: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/** Fetch (and lazily create) the singleton settings document. */
siteSettingSchema.statics.get = async function () {
  const existing = await this.findOne({ key: "site" });
  if (existing) return existing;
  return this.create({ key: "site" });
};

siteSettingSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.SiteSetting });

export const SiteSetting = Model("SiteSetting", siteSettingSchema);
