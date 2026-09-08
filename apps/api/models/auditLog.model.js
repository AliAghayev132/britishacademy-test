import { Schema, Model } from "#constants";

/**
 * AuditLog — admin panelində kim nə etdi.
 *
 * `LogService.logAction()` tərəfindən «tut-unut» şəklində yazılır, panelin
 * «Loglar» bölməsindən yalnız OXUNUR.
 *
 * ── NƏ DƏYİŞDİ VƏ NİYƏ ──
 * Əvvəl qeyd yalnız bir cümlə idi: «courses yeniləndi: IELTS». Yəni:
 *   • hansı sahənin dəyişdiyi bilinmirdi (qiymət? başlıq? aktivlik?);
 *   • əvvəlki dəyər itirdi, yəni «kim səhv etdi, əvvəl nə idi» sualına
 *     cavab yox idi;
 *   • GİRİŞLƏR ümumiyyətlə yazılmırdı — kimin nə vaxt daxil olduğu,
 *     uğursuz cəhdlərin olub-olmadığı görünmürdü;
 *   • müraciətin statusunu dəyişmək heç bir iz qoymurdu.
 *
 * İndi hər qeydə sahə-sahə fərq (`changes`), sorğu məlumatı və nəticə
 * (`status`) əlavə olunur.
 */

/** Bir sahənin dəyişməsi: nə idi → nə oldu. */
const changeSchema = new Schema(
  {
    field: { type: String, trim: true },
    // Dəyərlər OXUNAQLI sətir kimi saxlanılır (obyekt/massiv qısaldılır) —
    // log ekranında birbaşa göstərilir və axtarışa düşür.
    from: { type: String },
    to: { type: String },
  },
  { _id: false },
);

const auditLogSchema = new Schema(
  {
    actor: {
      id: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      role: { type: String, trim: true },
    },

    // create | update | delete | settings | seed | login | logout | user |
    // login-failed | status | send | export | reorder
    action: { type: String, required: true, index: true },
    resource: { type: String, trim: true }, // "courses", "leads", "users"…
    resourceId: { type: String, trim: true },
    // İnsan üçün qısa cümlə.
    summary: { type: String, trim: true },
    // Dəyişən sahələr — «nə idi → nə oldu» (QISA sətir kimi, siyahıda göstərmək üçün).
    changes: { type: [changeSchema], default: [] },

    /**
     * TAM məlumat — paneldəki «Detallar» modalı üçün.
     *
     * NİYƏ AYRICA: `changes` sətirdir və qısaldılır — massiv «5 element»
     * kimi yığılır, uzun mətn kəsilir. Yəni siyahı oxunaqlı qalır, amma
     * «tam olaraq nə dəyişdi» sualına cavab vermir. Burada dəyişən
     * sahələrin XAM dəyəri saxlanılır: yaradılanda `after`, siləndə
     * `before`, yeniləndə hər ikisi.
     *
     * `Mixed` — sxemi əvvəlcədən bilinmir (istənilən resurs ola bilər).
     * Ölçü `LogService`-də məhdudlaşdırılır, sirlər isə maskalanır.
     */
    details: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },

    // Uğursuz cəhdlər də yazılır (məs. səhv parol) — yalnız uğurlu
    // əməliyyatları saxlamaq təhlükəsizlik jurnalını mənasız edir.
    status: { type: String, enum: ["ok", "fail"], default: "ok", index: true },
    // Uğursuzluğun səbəbi (məs. «Şifrə yanlışdır»).
    reason: { type: String, trim: true },

    ip: { type: String, trim: true },
    // Hansı cihaz/brauzer — eyni hesaba fərqli yerdən girişi ayırd etmək üçün.
    userAgent: { type: String, trim: true },
    method: { type: String, trim: true },
    path: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
// «Bu adam nə edib?» — panelin istifadəçi süzgəci bu indeksdən istifadə edir.
auditLogSchema.index({ "actor.id": 1, createdAt: -1 });

export const AuditLog = Model("AuditLog", auditLogSchema);
