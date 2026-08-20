// Constants
import { Schema, Model } from "#constants";

/**
 * WhatsAppMessage — admin paneldən göndərilən hər mesajın qeydi.
 *
 * Nə üçün lazımdır:
 *  - kimə nə göndərildiyini izləmək (audit),
 *  - uğursuz göndərişləri görmək və təkrar cəhd etmək,
 *  - toplu göndərişdə eyni nömrəyə təkrar mesajın qarşısını almaq.
 */
const whatsappMessageSchema = new Schema(
  {
    // Normallaşdırılmış nömrə: "994501234567"
    phone: { type: String, required: true, trim: true, index: true },
    body: { type: String, default: "" },

    // Media göndərilibsə
    media: {
      filename: { type: String, trim: true },
      mimetype: { type: String, trim: true },
    },

    // sent → serverə verildi · delivered/read → message_ack ilə yenilənir
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
      index: true,
    },
    error: { type: String, default: "" },

    // Mənbə: tək mesaj, toplu göndəriş, yoxsa müraciət kartından
    source: {
      type: String,
      enum: ["manual", "bulk", "lead"],
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
