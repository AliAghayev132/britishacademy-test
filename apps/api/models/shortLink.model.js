// Constants
import { Schema, Model } from "#constants";

/**
 * ShortLink — reklam kampaniyaları üçün izlənilən qısa link.
 *
 * NİYƏ AYRICA SİSTEM:
 * Kampaniya linkinə neçə nəfər kliklədiyini bilmək lazımdır, amma sayta
 * gələn ümumi trafikdən onu ayırmaq mümkün deyil. UTM parametrləri xarici
 * analitika alətindən asılıdır; burada isə klik SERVERDƏ sayılır — reklam
 * platformasının öz rəqəmindən asılı olmayan müstəqil ölçü.
 *
 * Üstəlik hədəf sonradan dəyişdirilə bilər: eyni link paylaşıldıqdan sonra
 * başqa səhifəyə yönləndirilsin deyə. UTM ilə bu mümkün deyil.
 *
 * `clicks` denormallaşdırılmışdır — siyahıda hər link üçün ayrıca sayma
 * sorğusu getməsin. Dəqiq analitika LinkClick sənədlərindən hesablanır.
 */
const shortLinkSchema = new Schema(
  {
    // URL-də görünən hissə: /r/<code>. Kiçik hərflərə salınır ki,
    // çap materialında böyük hərflə yazılsa da işləsin.
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 64,
      match: /^[a-z0-9][a-z0-9-]*$/,
    },
    // Hədəf: daxili path ("/kurslar/ielts-kurslari") və ya tam URL.
    target: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      // Yalnız daxili path və ya http(s). "javascript:" kimi sxemlər
      // yönləndirmədə açıq-aşkar zərərlidir; admin səhvən yapışdıra bilər.
      //
      // Protokolsuz "//evil.com" da rədd edilir: brauzer onu XARİCİ ünvan kimi
      // oxuyur, yəni açıq yönləndirmə (open redirect) boşluğu yaradardı.
      validate: {
        validator: (v) => {
          const s = String(v || "").trim().toLowerCase();
          if (s.startsWith("//")) return false;
          return s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://");
        },
        message: 'Hədəf "/" ilə başlayan daxili ünvan və ya http(s) linki olmalıdır',
      },
    },
    // Kampaniyanın adı — paneldə linkləri ayırd etmək üçün ("Instagram sentyabr").
    title: { type: String, trim: true, maxlength: 200 },
    note: { type: String, trim: true, maxlength: 1000 },
    // Kampaniya bitəndə link bağlanır: klik sayılmır, ziyarətçi ana səhifəyə düşür.
    isActive: { type: Boolean, default: true },
    // Link bu tarixdən sonra işləmir (boşdursa müddətsizdir).
    expiresAt: { type: Date, default: null },

    clicks: { type: Number, default: 0 },
    lastClickAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

// Siyahı sıralaması — ən çox kliklənən əvvəldə.
shortLinkSchema.index({ isDeleted: 1, clicks: -1 });

/** Link hazırda yönləndirməyə yararlıdırmı? */
shortLinkSchema.methods.isUsable = function () {
  if (this.isDeleted || !this.isActive) return false;
  if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return false;
  return true;
};

export const ShortLink = Model("ShortLink", shortLinkSchema);
