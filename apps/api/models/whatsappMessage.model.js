// Constants
import { Schema, Model } from "#constants";

/**
 * Göndərilən mesajların qeydi — HƏM WhatsApp, HƏM e-poçt.
 *
 * ⚠️ Fayl/model adı tarixi səbəbdəndir: kolleksiya əvvəlcə yalnız WhatsApp
 * üçün idi, sonra e-poçt toplu göndərişi əlavə olundu. Mövcud datanı
 * miqrasiya etməmək üçün ad saxlanıldı; kanallar `channel` sahəsi ilə ayrılır.
 *
 * Nə üçün lazımdır:
 *  - kimə nə göndərildiyini izləmək (audit),
 *  - uğursuz göndərişləri görmək və təkrar cəhd etmək,
 *  - toplu göndərişdə eyni alıcıya təkrar mesajın qarşısını almaq.
 */
const whatsappMessageSchema = new Schema(
  {
    // Hansı kanal üzərindən göndərilib
    channel: {
      type: String,
      enum: ["whatsapp", "email"],
      default: "whatsapp",
      index: true,
    },

    // WhatsApp üçün: normallaşdırılmış nömrə "994501234567"
    phone: { type: String, trim: true, index: true },
    // E-poçt üçün: alıcı ünvanı
    email: { type: String, trim: true, lowercase: true, index: true },
    // Alıcının adı (şablon dəyişəni və hesabat üçün)
    name: { type: String, trim: true },
    // E-poçt mövzusu
    subject: { type: String, trim: true },

    body: { type: String, default: "" },

    // Media göndərilibsə
    media: {
      filename: { type: String, trim: true },
      mimetype: { type: String, trim: true },
    },

    // sent → serverə verildi · delivered/read → message_ack ilə yenilənir
    // (delivered/read yalnız WhatsApp-da mümkündür)
    //
    // skipped → QƏSDƏN göndərilməyib (son 24 saatda mesaj alıb). Ayrıca
    // status lazımdır: əvvəl belə sətirlər ümumiyyətlə yazılmırdı və admin
    // «bu adama niyə getmədi» sualına cavab tapa bilmirdi. «failed» kimi
    // yazmaq da olmazdı — hesabatda xəta kimi görünərdi.
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed", "skipped"],
      default: "sent",
      index: true,
    },
    error: { type: String, default: "" },

    // Mənbə: tək mesaj · müraciətlər · Excel faylı · əl ilə yazılan siyahı
    source: {
      type: String,
      enum: ["manual", "bulk", "lead", "excel", "list"],
      default: "manual",
      index: true,
    },
    // Müraciətdən göndərilibsə — həmin lead
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
    // Göndərən admin/editor
    sentBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);

whatsappMessageSchema.index({ createdAt: -1 });

export const WhatsAppMessage = Model("WhatsAppMessage", whatsappMessageSchema);
