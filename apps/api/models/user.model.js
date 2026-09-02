import { Schema, Model, userRoles, accountStatus, adminSections } from "#constants";

const userSchema = new Schema(
  {
    // Personal info
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // creates a unique index implicitly
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      // Sorğularda DEFAULT olaraq gəlmir — diqqətsiz `res.json({ user })`
      // bcrypt hash-ini sızdıra bilməsin. Lazım olan yerdə .select("+password").
      select: false,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },

    // Role & status
    role: {
      type: String,
      enum: userRoles,
      default: "user",
    },
    status: {
      type: String,
      enum: accountStatus,
      default: "active",
    },

    /**
     * İcazə verilmiş admin panel bölmələri.
     *
     * BOŞ massiv = «məhdudiyyət yoxdur» DEYİL — heç bir bölmə deməkdir.
     * superadmin və developer bu sahədən asılı deyil (hər şeyi görürlər),
     * ona görə onlar üçün doldurulmasına ehtiyac yoxdur.
     */
    permissions: {
      type: [String],
      enum: adminSections,
      default: [],
    },

    /**
     * Xaricdə təhsil müraciətlərində əhatə dairəsi.
     *
     * BOŞ = MƏHDUDİYYƏT YOXDUR — `permissions` ilə eyni konvensiya. Belə
     * olmasaydı, bu sahə əlavə olunan kimi bütün mövcud adminlər xaricdə
     * təhsil müraciətlərini görməyi dayandırardı.
     *
     * Doludursa istifadəçi YALNIZ sadalanan ölkələrə aid müraciətləri görür —
     * həm siyahıda, həm də filtr seçimlərində.
     */
    allowedDestinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],

    // Token version for "logout all devices"
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // Last login timestamp
    lastLogin: {
      type: Date,
      default: null,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Indexes (email is already indexed via unique: true)
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

export const User = Model("User", userSchema);
