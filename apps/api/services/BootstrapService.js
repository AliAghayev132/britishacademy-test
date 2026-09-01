// Models
import { User } from "#models";

// Services
import { HashService } from "#services";

// Config
import { config } from "#config";

/**
 * Create a default admin user on first boot if none exists.
 * Credentials come from DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD.
 */
const bootstrapAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return;
    }

    const hashedPassword = await HashService.hashPassword(
      config.defaultAdmin.password,
    );

    const admin = await User.create({
      firstName: "Default",
      lastName: "Admin",
      email: config.defaultAdmin.email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    console.log("🚀 Default admin created successfully!");
    console.log("   Email:", admin.email);
    console.log("   Password:", config.defaultAdmin.password);
    console.log("   ⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating default admin:", error.message);
  }
};

/**
 * İlk açılışda developer hesabı yaradır.
 *
 * Developer rolu texniki alətlərə (seed, miqrasiya, toplu tərcümə, importlar)
 * yeganə giriş yoludur — admin panelin qalan hissəsindən ayrıdır ki, adi
 * admin səhvən məzmunu kütləvi dəyişməsin.
 *
 * MÖVCUD hesaba TOXUNMUR: ENV dəyərləri yalnız ilk yaradılışda işlədilir,
 * ona görə sahibi ad/e-poçt/parolu sərbəst dəyişə bilər.
 */
const bootstrapDeveloper = async () => {
  try {
    const existing = await User.findOne({ role: "developer" });
    if (existing) {
      console.log("✅ Developer hesabı mövcuddur:", existing.email);
      return;
    }

    const hashedPassword = await HashService.hashPassword(
      config.defaultDeveloper.password,
    );

    const dev = await User.create({
      // lastName modeldə MƏCBURİDİR — boş string validasiyadan keçmir və
      // hesab səssizcə yaradılmırdı ("User validation failed: lastName").
      firstName: "Developer",
      lastName: "Hesabı",
      email: config.defaultDeveloper.email,
      password: hashedPassword,
      role: "developer",
      status: "active",
    });

    console.log("🛠️  Developer hesabı yaradıldı!");
    console.log("   E-poçt:", dev.email);
    console.log("   Parol :", config.defaultDeveloper.password);
    console.log("   ⚠️  İlk girişdən sonra parolu dəyişin.");
  } catch (error) {
    console.error("❌ Developer hesabı yaradıla bilmədi:", error.message);
  }
};

export { bootstrapAdmin, bootstrapDeveloper };
