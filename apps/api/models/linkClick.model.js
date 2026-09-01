// Constants
import { Schema, Model } from "#constants";

/**
 * LinkClick — qısa linkə edilən bir klik.
 *
 * ŞƏXSİ MƏLUMAT SAXLANILMIR. IP ünvanı olduğu kimi yazılsaydı bu, şəxsi
 * məlumat toplusu olardı; əvəzinə IP + brauzer izi duzla birlikdə heşlənir
 * (`visitorHash`). Heş yalnız «bu, əvvəlki ziyarətçi ilə eynidirmi» sualına
 * cavab verir — geri çevrilib IP-ni bərpa etmək mümkün deyil.
 *
 * Unikal ziyarətçi sayı bu heşin `$group`-u ilə hesablanır; ayrıca sayğac
 * saxlanılmır ki, hər klikdə əlavə yazma sorğusu olmasın.
 */
const linkClickSchema = new Schema(
  {
    link: { type: Schema.Types.ObjectId, ref: "ShortLink", required: true },
    ts: { type: Date, default: Date.now },

    visitorHash: { type: String, index: true },

    // Cihaz bölgüsü — reklamın hansı platformada işlədiyini göstərir.
    device: { type: String, enum: ["mobile", "tablet", "desktop", "bot", "other"], default: "other" },
    browser: { type: String, trim: true },
    os: { type: String, trim: true },
    // Referer YALNIZ domen kimi saxlanılır (instagram.com), tam URL kimi yox —
    // tam URL şəxsi məlumat daşıya bilər.
    source: { type: String, trim: true, default: "birbaşa" },
    lang: { type: String, trim: true },
  },
  { versionKey: false },
);

// Qrafik və bölgü sorğuları həmişə link + tarix üzrədir.
linkClickSchema.index({ link: 1, ts: -1 });

export const LinkClick = Model("LinkClick", linkClickSchema);
