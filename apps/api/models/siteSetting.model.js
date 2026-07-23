import { Schema, Model } from "#constants";
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
      address: { type: String },
      hours: { type: String },
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
      titlePrefix: { type: String, default: "British Academy ilə" },
      words: { type: [String], default: [] },
      colors: { type: [String], default: [] },
      subtitle: { type: String },
    },

    // "20 000+ məzun" style counters
    stats: { type: [factSchema], default: [] },
    // Scrolling marquee strip
    marquee: { type: [String], default: [] },

    seo: {
      titleTemplate: { type: String, default: "%s — British Academy" },
      defaultTitle: { type: String },
      defaultDescription: { type: String },
      defaultOgImage: { type: String },
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

export const SiteSetting = Model("SiteSetting", siteSettingSchema);
