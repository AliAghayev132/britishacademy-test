import { Schema, Model, mediaTypes } from "#constants";
// Utils
import { localizedField, i18nPlugin, LOCALIZED_FIELDS } from "#utils";

/**
 * Media — qalereya (yükləmə kitabxanası).
 *
 * Hər yüklənən şəkil buraya avtomatik yazılır (mediaController.uploadImage),
 * beləcə admin növbəti dəfə eyni şəkli yenidən yükləmək əvəzinə qalereyadan
 * seçə bilir. Əvvəl yükləmə yalnız URL qaytarırdı və kitabxana boş qalırdı.
 *
 * `folder` qalereyanı bölmələrə ayırır — «Bayraqlar» qovluğu ölkə kartları
 * üçün hazır saxlanılır.
 */
const mediaSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    // Default alt derived from the original filename; editable per use.
    alt: localizedField(),

    /**
     * Qalereya bölməsi. Sərbəst mətndir (enum deyil) — yeni bölmə əlavə etmək
     * üçün miqrasiya lazım olmasın. UI mövcud dəyərlərdən siyahı qurur.
     */
    folder: { type: String, trim: true, default: "ümumi", index: true },
    /** Axtarış üçün açar sözlər (məs. "almaniya, bayraq, avropa"). */
    tags: { type: [String], default: [] },

    type: { type: String, enum: mediaTypes, default: "image" },
    mimeType: { type: String, trim: true },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

mediaSchema.index({ createdAt: -1 });
// Eyni fayl iki dəfə qeyd olunmasın (yenidən yükləmə mövcud qeydi yeniləyir).
mediaSchema.index({ url: 1 }, { unique: true });

mediaSchema.plugin(i18nPlugin, { fields: LOCALIZED_FIELDS.Media });

export const Media = Model("Media", mediaSchema);
