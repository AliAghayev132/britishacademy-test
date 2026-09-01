/**
 * Admin giriş diaqnostikası və bərpası.
 *
 * Niyə lazımdır: `bootstrapAdmin` admini YALNIZ heç bir admin yoxdursa yaradır.
 * Yəni serverdə artıq admin varsa, `.env`-dəki DEFAULT_ADMIN_PASSWORD-u
 * dəyişib yenidən başlatmaq HEÇ NƏ etmir — köhnə parol qüvvədə qalır. Bu,
 * "default kodla girə bilmirəm" probleminin ən çox rast gəlinən səbəbidir.
 *
 * İSTİFADƏ (serverdə, apps/api qovluğunda):
 *
 *   node scripts/adminDoctor.js
 *       → mövcud admin/editor hesablarını göstərir (parol göstərilmir)
 *
 *   node scripts/adminDoctor.js --reset
 *       → .env-dəki DEFAULT_ADMIN_EMAIL/PASSWORD ilə parolu sıfırlayır;
 *         həmin email yoxdursa admin YARADIR
 *
 *   node scripts/adminDoctor.js --reset --email=x@y.z --password='YeniParol123!'
 *       → konkret hesabın parolunu sıfırlayır
 *
 *   node scripts/adminDoctor.js --dev
 *       → DEVELOPER hesabını yoxlayır (.env-dəki DEFAULT_DEVELOPER_*)
 *
 *   node scripts/adminDoctor.js --dev --reset
 *       → developer hesabını yaradır və ya parolunu sıfırlayır
 *
 * Parol dəyişdirildikdə `tokenVersion` artırılır — bütün köhnə sessiyalar düşür.
 */

// Services
import { mongoDBService, HashService } from "#services";

// Models
import { User } from "#models";

// Config
import { config } from "#config";

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const has = (name) => process.argv.includes(`--${name}`);

const mask = (s) => (s ? `${s.slice(0, 2)}${"•".repeat(Math.max(s.length - 2, 3))}` : "—");

async function main() {
  await mongoDBService.connect();

  // --dev bayrağı hədəfi developer hesabına çevirir. Ayrıca skript yazmaq
  // əvəzinə eyni diaqnostikanı işlədirik — problem eynidir: bootstrap hesabı
  // YALNIZ yoxdursa yaradır, .env dəyişikliyi mövcud hesaba təsir etmir.
  const devMode = has("dev");
  const defaults = devMode ? config.defaultDeveloper : config.defaultAdmin;
  const targetRole = devMode ? "developer" : "admin";

  const email = (arg("email") || defaults.email || "").toLowerCase();
  const password = arg("password") || defaults.password;

  // ── 1) Mövcud vəziyyət ──
  // --dev rejimində yalnız developer hesabları göstərilir.
  const roleFilter = devMode
    ? ["developer"]
    : ["admin", "editor", "superadmin", "developer"];
  const users = await User.find({ role: { $in: roleFilter } })
    .select("+password")
    .lean();

  console.log(`\n═══ ${devMode ? "DEVELOPER" : "ADMIN"} HESABLARI ═══`);
  if (!users.length) {
    console.log(`  ⚠️  HEÇ BİR ${devMode ? "developer" : "admin/editor"} hesabı yoxdur.`);
  } else {
    for (const u of users) {
      const flags = [
        u.status !== "active" ? `status=${u.status}` : null,
        u.isDeleted ? "SİLİNİB" : null,
        !u.password ? "PAROL YOXDUR" : null,
      ].filter(Boolean);
      console.log(
        `  ${u.email.padEnd(34)} ${u.role.padEnd(7)}` +
          `${flags.length ? "  ⚠️  " + flags.join(", ") : "  ✓"}`,
      );
    }
  }

  console.log("\n═══ .env GÖZLƏNTİSİ ═══");
  const envPrefix = devMode ? "DEFAULT_DEVELOPER" : "DEFAULT_ADMIN";
  console.log(`  ${envPrefix}_EMAIL   :`, defaults.email);
  console.log(`  ${envPrefix}_PASSWORD:`, mask(defaults.password));

  // ── 2) Hədəf hesabı yoxla ──
  const target = await User.findOne({ email }).select("+password");
  console.log("\n═══ DİAQNOZ ═══");

  if (!target) {
    console.log(`  ❌ "${email}" bazada YOXDUR — bu email ilə giriş mümkün deyil.`);
  } else {
    const match = target.password
      ? await HashService.comparePassword(password, target.password)
      : false;
    console.log(`  hesab tapıldı     : ${target.email} (${target.role})`);
    console.log(`  silinib?          : ${target.isDeleted ? "BƏLİ ❌" : "xeyr ✓"}`);
    console.log(`  status            : ${target.status}${target.status === "active" ? " ✓" : " ❌ (403 verəcək)"}`);
    console.log(`  .env parolu uyğun?: ${match ? "BƏLİ ✓" : "XEYR ❌"}`);
    if (!match) {
      console.log("\n  → Parol bazadakından fərqlidir. Səbəb: bootstrapAdmin admini");
      console.log("    yalnız heç biri yoxdursa yaradır, .env dəyişikliyi mövcud");
      console.log("    hesaba TƏSİR ETMİR. `--reset` ilə sıfırlayın.");
    }
  }

  // ── 3) Sıfırla / yarat ──
  if (has("reset")) {
    if (!password || password.length < 8) {
      console.log("\n❌ Parol ən azı 8 simvol olmalıdır.");
    } else {
      const hash = await HashService.hashPassword(password);
      if (target) {
        target.password = hash;
        target.status = "active";
        target.isDeleted = false;
        // --dev ilə çağırılıbsa rolu developer-ə qaldırırıq; əks halda
        // editor-u admin edirik (köhnə davranış).
        if (devMode) target.role = "developer";
        else if (target.role === "editor") target.role = "admin";
        target.tokenVersion = (target.tokenVersion || 0) + 1; // köhnə sessiyaları düşür
        await target.save();
        console.log(`\n✅ Parol sıfırlandı: ${target.email}`);
      } else {
        const created = await User.create({
          firstName: devMode ? "Developer" : "Default",
          lastName: devMode ? "Hesabı" : "Admin",
          email,
          password: hash,
          role: targetRole,
          status: "active",
        });
        console.log(`\n✅ Yeni ${targetRole} yaradıldı: ${created.email}`);
      }
      console.log(`   Parol: ${password}`);
      console.log("   ⚠️  Girişdən sonra dəyişdirin.");
    }
  } else {
    console.log(`\n(Sıfırlamaq üçün: node scripts/adminDoctor.js${devMode ? " --dev" : ""} --reset)`);
  }

  await mongoDBService.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\n❌ Xəta:", err.message);
  try { await mongoDBService.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
