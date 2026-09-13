// Lib
import { crypto, mongoose } from "#lib";
// Constants
import { Schema, Model, otpTypes } from "#constants";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: otpTypes,
      default: "register",
    },
    // Arbitrary payload carried between OTP steps (e.g. hashed password on register)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // TTL index: document auto-deletes once expiresAt passes
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Generate a 6-digit OTP code
otpSchema.statics.generateCode = function () {
  return crypto.randomInt(100000, 999999).toString();
};

/** Bir kod üçün səhv cəhd limiti. */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * 10 dəqiqəlik kod yarat (eyni tipli köhnəsini əvəz edir).
 *
 * CƏHD SAYĞACI YENİ KODLA SIFIRLANMIR. Əvvəl sıfırlanırdı: 5 səhv təxmindən
 * sonra «yenidən göndər» basıb növbəti 5-i sınamaq olurdu — 6 rəqəmli kod
 * saatlar ərzində tapılırdı. Sayğac köhnə sənəd TTL ilə silinənə qədər
 * (10 dəqiqə) qalır; həqiqi istifadəçi ən çox 10 dəqiqə gözləyir.
 */
otpSchema.statics.createOTP = async function (email, type, data = {}) {
  const addr = email.toLowerCase();
  const prev = await this.findOne({ email: addr, type }).select("attempts").lean();
  await this.deleteMany({ email: addr, type });

  const code = this.generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return this.create({
    email: addr,
    code,
    type,
    data,
    expiresAt,
    attempts: prev?.attempts || 0,
  });
};

/** Sabit vaxtlı müqayisə — cavab müddətindən kodu təxmin etmək olmasın. */
const sameCode = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * Kodu yoxla.
 *
 * ATOMİK: cəhd kod müqayisəsindən ƏVVƏL, bir sorğu ilə sayılır. Əvvəl
 * oxu → +1 → saxla idi: eyni anda göndərilən yüzlərlə təxminin hamısı
 * «0 cəhd» görürdü və limit işləmirdi. Limitə çatmış kod SİLİNMİR — silinsə
 * yeni kod sayğacı sıfırdan başladardı.
 */
otpSchema.statics.verifyOTP = async function (email, code, type) {
  const addr = String(email || "").toLowerCase();
  const now = new Date();
  const otp = await this.findOneAndUpdate(
    { email: addr, type, verified: false, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );

  if (!otp) {
    const locked = await this.exists({ email: addr, type, verified: false, expiresAt: { $gt: now } });
    return locked
      ? { valid: false, error: "Too many invalid attempts. Try again in 10 minutes" }
      : { valid: false, error: "OTP not found or expired" };
  }

  if (!sameCode(otp.code, code)) {
    return { valid: false, error: "Invalid OTP code" };
  }

  otp.verified = true;
  await otp.save();

  return { valid: true, data: otp.data };
};

export const OTP = Model("OTP", otpSchema);
