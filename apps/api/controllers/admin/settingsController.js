// Sayt tənzimləmələri — tək SiteSetting sənədi.

// Models
import { SiteSetting } from "#models";

// Services
import { logAction, diffDocs, pickFields } from "#services";

// Utils
import { fail, ok, asyncHandler, hasRole, canAccessSection } from "#utils";

/**
 * Yalnız `admin` rolunun dəyişə biləcəyi tənzimləmə blokları.
 *
 * ⚠️ Bunların hamısı infrastruktur/təhlükəsizlik təsirlidir:
 *  - smtp / ai            → kimlik məlumatları və API açarları
 *  - codeInjection        → saytın hər səhifəsində ixtiyari skript
 *  - robotsTxt            → axtarış indeksləşməsini söndürə bilər
 *  - organizationSchema   → JSON-LD inyeksiyası
 *  - maxImageSizeKb       → yükləmə limiti
 * `editor` rolu məzmun sahələrini (contact, hero, seo mətnləri, stats…) dəyişə bilər.
 */
/** «Ana səhifə» bölməsinin idarə etdiyi tənzimləmə blokları. */
const HOME_SETTING_FIELDS = ["homeSections", "hero", "marquee", "stats"];

const ADMIN_ONLY_SETTING_FIELDS = [
  "smtp", "ai", "codeInjection", "robotsTxt", "organizationSchema", "maxImageSizeKb",
];

/** Gizli açarları cavabdan çıxar (yalnız-yazma; var/yox işarəsi qalır). */
function maskSettings(settings) {
  const out = typeof settings?.toObject === "function" ? settings.toObject() : { ...settings };
  if (out.smtp) out.smtp = { ...out.smtp, hasPass: Boolean(out.smtp.pass), pass: "" };
  if (out.ai) out.ai = { ...out.ai, hasKey: Boolean(out.ai.apiKey), apiKey: "" };
  return out;
}

/** GET /api/admin/settings — the singleton SiteSetting document. */
const getSettings = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.get();
  ok(res, { settings: maskSettings(settings) });
});

/** PUT /api/admin/settings — partial update of the singleton. */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.get();
  const body = { ...req.body };

  // «Ana səhifə» bölməsi də bu endpointə yazır (hero, lent, statistika).
  // Ona görə iki icazədən biri kifayətdir, LAKİN yalnız «home» icazəsi olan
  // adam qalan bloklara — SMTP, AI, brend, SEO, kod inyeksiyası — toxuna
  // bilməməlidir. Əvvəl endpoint tamamilə açıq idi.
  const canSettings = canAccessSection(req.user, "settings");
  const canHome = canAccessSection(req.user, "home");
  if (!canSettings && !canHome) {
    return fail(res, "Bu bölməyə icazəniz yoxdur", 403);
  }
  if (!canSettings) {
    for (const key of Object.keys(body)) {
      if (!HOME_SETTING_FIELDS.includes(key)) delete body[key];
    }
  }
  delete body._id;
  delete body.key;
  delete body.createdAt;
  delete body.updatedAt;

  // Editor privilegiyalı blokları göndərsə — sükutla at (səhv redaktə cəzalandırılmasın,
  // amma dəyişiklik də tətbiq olunmasın).
  if (!hasRole(req.user, "admin")) {
    const blocked = ADMIN_ONLY_SETTING_FIELDS.filter((f) => f in body);
    for (const f of blocked) delete body[f];
    if (blocked.length) {
      console.warn(`⚠️ settings: ${req.user?.email || "editor"} admin-only sahələri dəyişməyə çalışdı: ${blocked.join(", ")}`);
    }
  }

  // Kod inyeksiyası (və GTM) saytda İXTİYARİ JavaScript işlədir. Admin
  // tokenləri eyni origin-in localStorage-ındadır — admin rolunun yazdığı
  // skript superadmin/developer sessiyasını ələ keçirə bilərdi. Ona görə
  // yazmaq yalnız superadmin və developer üçündür.
  if (!hasRole(req.user, "superadmin")) delete body.codeInjection;

  // Gizli açar boş gəlibsə köhnəsini saxla (frontend geri almır).
  if (body.smtp && !body.smtp.pass) {
    body.smtp = { ...body.smtp, pass: settings.smtp?.pass || "" };
  }
  if (body.ai && !body.ai.apiKey) {
    body.ai = { ...body.ai, apiKey: settings.ai?.apiKey || "" };
  }
  // Tənzimləmələrdə də «nə idi → nə oldu» saxlanılır. Əvvəl yalnız
  // «yeniləndi» yazılırdı — hansı blokun (SMTP? SEO? əlaqə?) dəyişdiyi
  // bilinmirdi, halbuki bura saytın ən həssas ayarlarıdır.
  const keys = Object.keys(body);
  const beforeSettings = pickFields(settings, keys);

  Object.assign(settings, body);
  await settings.save();

  const settingChanges = diffDocs(beforeSettings, pickFields(settings, keys));
  const touchedKeys = settingChanges.map((c) => c.field);
  await logAction(req, {
    action: "settings", resource: "settings",
    summary: touchedKeys.length
      ? `Tənzimləmələr yeniləndi: ${touchedKeys.join(", ")}`
      : "Sayt tənzimləmələri yeniləndi",
    changes: settingChanges,
    details: touchedKeys.length
      ? { before: pickFields(beforeSettings, touchedKeys), after: pickFields(settings, touchedKeys) }
      : undefined,
  });
  // Cavabda da maskala — əks halda parol/açar admin panelə geri qayıdırdı.
  ok(res, { settings: maskSettings(settings) }, "Tənzimləmələr yeniləndi");
});

export { getSettings, updateSettings };
