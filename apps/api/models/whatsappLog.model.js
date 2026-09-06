// Constants
import { Schema, Model } from "#constants";

/**
 * WhatsAppLog — WhatsApp bağlantısının HADİSƏ jurnalı.
 *
 * NİYƏ AYRICA JURNAL:
 *  • `WhatsAppMessage` göndərilən MESAJLARI saxlayır — «kimə nə getdi».
 *  • `AuditLog` admin ƏMƏLİYYATLARINI saxlayır — «kim nə basdı».
 * Bağlantının özü isə (QR, autentifikasiya, vəziyyət dəyişmələri, kəsilmə,
 * Chrome xətaları, sağlamlıq yoxlaması) heç yerdə qalmırdı — yalnız server
 * konsoluna yazılırdı. Nəticədə «dünən gecə niyə kəsildi» sualına cavab
 * vermək üçün serverə SSH ilə girib jurnal faylına baxmaq lazım gəlirdi.
 *
 * Bu jurnal panelə çıxarılır, ona görə hadisələr insan dilində yazılır.
 *
 * SAXLANMA MÜDDƏTİ: 30 gün (TTL indeksi). Hadisələr sıxdır — sağlamlıq
 * yoxlaması hər dövrədə yazır — və köhnə sətirlərin dəyəri yoxdur.
 */

/** Hadisə növləri — paneldəki süzgəc bunlarla işləyir. */
export const WA_LOG_TYPES = [
  "init", // qoşulma başladıldı
  "qr", // QR kod / qoşulma kodu hazırlandı
  "auth", // autentifikasiya uğurlu / uğursuz
  "ready", // klient hazırdır
  "state", // WAState dəyişdi (CONNECTED, OPENING, …)
  "disconnect", // bağlantı kəsildi
  "health", // dövri sağlamlıq yoxlaması
  "send", // mesaj göndərildi / alınmadı
  "ack", // çatdırılma və oxunma bildirişi
  "session", // sessiya saxlanıldı / silindi
  "version", // kitabxananın yeni versiyası
  "error", // digər xətalar
];

const whatsappLogSchema = new Schema(
  {
    type: { type: String, enum: WA_LOG_TYPES, required: true, index: true },
    // info → adi gediş · warn → diqqət tələb edir · error → işləmir
    level: { type: String, enum: ["info", "warn", "error"], default: "info", index: true },
    // İnsan dilində qısa təsvir — panelin əsas sütunu.
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    // Əlavə texniki məlumat (vəziyyət adı, səbəb, nömrə, versiya…).
    meta: { type: Schema.Types.Mixed, default: null },
    // Əməliyyatı başladan admin (avtomatik hadisələrdə boş).
    actor: {
      id: { type: Schema.Types.ObjectId, ref: "User" },
      email: { type: String, trim: true },
    },
  },
  { timestamps: true, versionKey: false },
);

whatsappLogSchema.index({ createdAt: -1 });
whatsappLogSchema.index({ type: 1, createdAt: -1 });
// 30 gündən köhnə sətirlər avtomatik silinir.
whatsappLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const WhatsAppLog = Model("WhatsAppLog", whatsappLogSchema);
