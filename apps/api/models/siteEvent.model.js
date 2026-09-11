// Constants
import { Schema, Model } from "#constants";

/**
 * SiteEvent — «müraciət hunisi»nin bir addımı.
 *
 *   visit        — sayta giriş (sessiyada BİR dəfə)
 *   modal_open   — «Müraciət et» formu açıldı
 *   lead_submit  — müraciət HƏQİQƏTƏN yarandı (yalnız serverdə yazılır —
 *                  saytdan gələn «göndərdim» siqnalı saxtalaşdırıla bilərdi)
 *
 * ŞƏXSİ MƏLUMAT SAXLANILMIR: nə IP, nə ad/telefon. `sid` brauzerdə təsadüfi
 * yaradılan anonim sessiya kodudur (30 dəq fəaliyyətsizlikdən sonra yenilənir).
 * Referer yalnız domen kimi (instagram.com) saxlanılır.
 *
 * Qeydlər 400 gündən sonra avtomatik silinir (TTL) — il-il müqayisə üçün
 * kifayətdir, baza isə sonsuz böyümür.
 */
export const SITE_EVENT_TYPES = ["visit", "modal_open", "lead_submit"];

const siteEventSchema = new Schema(
  {
    type: { type: String, enum: SITE_EVENT_TYPES, required: true },
    ts: { type: Date, default: Date.now },
    sid: { type: String, required: true },
    path: { type: String, trim: true, default: "/" },
    source: { type: String, trim: true, default: "birbaşa" },
    campaign: { type: String, trim: true },
    device: { type: String, enum: ["mobile", "tablet", "desktop", "other"], default: "other" },
    // lead_submit: müraciətin gəldiyi forma (apply-modal, contact-page …)
    form: { type: String, trim: true },
  },
  { versionKey: false },
);

siteEventSchema.index({ type: 1, ts: -1 });
siteEventSchema.index({ sid: 1, type: 1 });
siteEventSchema.index({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 400 });

export const SiteEvent = Model("SiteEvent", siteEventSchema);
