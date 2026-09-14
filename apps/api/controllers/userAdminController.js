// ── Admin user management + audit logs ──
// Create/manage multiple admin/editor accounts, and read the audit log.
// All routes are already authenticated + role-gated at the router; the write
// operations here additionally require the "admin" role (editors can't manage
// users). Passwords are hashed with HashService; password is never returned.

// Constants
import { adminRoles, adminSections } from "#constants";

// Models
import { User, AuditLog } from "#models";

// Services
import { HashService, logAction, diffDocs, socketService } from "#services";

// Middlewares
import { canAssignRole } from "#middlewares";

// Utils
import {
  fail,
  ok,
  pageInfo,
  parsePage,
  asyncHandler,
  fuzzyRegex,
  hasRole,
  cleanIds,
  isObjectId,
  dateRange,
  initialPermissions,
} from "#utils";

/**
 * İstifadəçi idarəsi üçün minimum səlahiyyət.
 *
 * ƏVVƏL bu, rolun dəqiq «admin» olmasını tələb edirdi. Rollar genişlənəndə
 * (superadmin, developer) həmin yoxlama ONLARI bloklayırdı, halbuki route
 * səviyyəsində məhz onlara icazə verilir. Nəticədə HEÇ KİM istifadəçi idarə
 * edə bilmirdi: admin route-dan, superadmin/developer isə buradan geri
 * qaytarılırdı.
 */
/**
 * Ölkə əhatəsi — yalnız ObjectId formasındakı dəyərlər qəbul olunur.
 * Boş massiv «məhdudiyyət yoxdur» deməkdir (bax utils/roles.js).
 */
const cleanDestinations = (v) =>
  cleanIds(v);

const canManageUsers = (req) => hasRole(req.user, "superadmin");
const publicUser = (u) => ({
  _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email,
  phone: u.phone, role: u.role, status: u.status, lastLogin: u.lastLogin,
  permissions: u.permissions || [],
  allowedDestinations: (u.allowedDestinations || []).map((d) => (d?._id ? d._id : d)),
  allowedBranches: (u.allowedBranches || []).map((b) => (b?._id ? b._id : b)),
  createdAt: u.createdAt,
});

// ── GET /api/admin/users ──
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = { isDeleted: false, role: { $in: adminRoles } };
  if (req.query.role && adminRoles.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) {
    const rx = fuzzyRegex(req.query.search, 60);
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  ok(res, { items, pagination: pageInfo({ page, limit }, total) });
});

// ── POST /api/admin/users ──
const createUser = asyncHandler(async (req, res) => {
  if (!canManageUsers(req)) return fail(res, "Bu əməliyyat üçün super admin səlahiyyəti lazımdır", 403);
  const {
    firstName, lastName, email, password, phone,
    role = "editor", status = "active", permissions = [], allowedDestinations = [], allowedBranches = [],
  } = req.body || {};
  if (!firstName || !lastName || !email || !password) {
    return fail(res, "Ad, soyad, e-poçt və parol tələb olunur", 400);
  }
  if (String(password).length < 8) return fail(res, "Parol ən azı 8 simvol olmalıdır", 400);
  if (!adminRoles.includes(role)) return fail(res, "Yanlış rol", 400);
  // Kimsə ÖZÜNDƏN yüksək rol təyin edə bilməz — əks halda istənilən
  // superadmin özünə developer hesabı yaradardı.
  if (!canAssignRole(req.user?.role, role)) {
    return fail(res, "Özünüzdən yüksək və ya bərabər rol təyin edə bilməzsiniz", 403);
  }
  let cleanPerms;
  try {
    cleanPerms = initialPermissions(role, cleanPermissions(permissions));
  } catch (err) {
    return fail(res, err.message, 400);
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return fail(res, "Bu e-poçt artıq istifadə olunur", 409);

  const user = await User.create({
    firstName, lastName, email, phone, role, status, permissions: cleanPerms,
    allowedDestinations: cleanDestinations(allowedDestinations),
    allowedBranches: cleanDestinations(allowedBranches),
    password: await HashService.hashPassword(password),
  });
  await logAction(req, { action: "user", resource: "users", resourceId: user._id, summary: `İstifadəçi yaradıldı: ${email} (${role})` });
  ok(res, { item: publicUser(user) }, "İstifadəçi yaradıldı", 201);
});

/**
 * İcazə siyahısını süz.
 *
 * TƏHLÜKƏLİ HAL: boş massiv «məhdudiyyət yoxdur» deməkdir (geriyə uyğunluq
 * üçün). Yəni tanınmayan açar səssizcə atılsaydı, ["projects"] göndərmək
 * istifadəçini məhdudlaşdırmaq əvəzinə ona TAM SƏLAHİYYƏT verərdi — məhz belə
 * olmuşdu: «projects» və «leads-abroad» ağ siyahıda yox idi.
 *
 * Ona görə hamısı tanınmayanda xəta qaytarılır.
 */
function cleanPermissions(list) {
  const arr = Array.isArray(list) ? list : [];
  const clean = arr.filter((x) => adminSections.includes(x));
  if (arr.length && !clean.length) {
    const err = new Error(`Tanınmayan bölmə: ${arr.join(", ")}`);
    err.status = 400;
    throw err;
  }
  return clean;
}

// ── PUT /api/admin/users/:id ──
const updateUser = asyncHandler(async (req, res) => {
  if (!canManageUsers(req)) return fail(res, "Bu əməliyyat üçün super admin səlahiyyəti lazımdır", 403);
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) return fail(res, "Tapılmadı", 404);

  const { firstName, lastName, phone, role, status, password, permissions, allowedDestinations, allowedBranches } = req.body || {};

  // Özündən yüksək/bərabər istifadəçiyə toxunmaq olmaz — admin superadmin-i
  // dəyişə bilməməlidir.
  if (!canAssignRole(req.user?.role, user.role)) {
    return fail(res, "Bu istifadəçini dəyişməyə icazəniz yoxdur", 403);
  }
  // Dəyişiklikdən ƏVVƏLKİ dəyərlər — jurnalda «nə idi → nə oldu» üçün.
  const before = {
    firstName: user.firstName, lastName: user.lastName, phone: user.phone,
    role: user.role, status: user.status,
    permissions: user.permissions, allowedDestinations: user.allowedDestinations,
    allowedBranches: user.allowedBranches,
    ...(password ? { password: "köhnə" } : {}),
  };

  if (firstName != null) user.firstName = firstName;
  if (lastName != null) user.lastName = lastName;
  if (phone != null) user.phone = phone;
  if (role && adminRoles.includes(role)) {
    if (!canAssignRole(req.user?.role, role)) {
      return fail(res, "Özünüzdən yüksək və ya bərabər rol təyin edə bilməzsiniz", 403);
    }
    user.role = role;
  }
  if (Array.isArray(permissions)) {
    let next;
    try {
      next = cleanPermissions(permissions);
    } catch (err) {
      return fail(res, err.message, 400);
    }
    // Boş siyahı «bütün bölmələr» deməkdir. MƏHDUD hesabı boşaltmaq ona
    // səssizcə TAM giriş verirdi («Təmizlə» düyməsi). Köhnə, onsuz da boş
    // hesab isə olduğu kimi qalır (məs. yalnız filialı dəyişdiriləndə).
    const wasRestricted = (user.permissions || []).length > 0;
    if (!next.length && wasRestricted && user.role !== "superadmin" && user.role !== "developer") {
      return fail(res, "Ən azı bir bölmə seçin. Hesabı tam bağlamaq üçün statusunu «deaktiv» edin.", 400);
    }
    user.permissions = next;
  }
    if (Array.isArray(allowedDestinations)) {
      user.allowedDestinations = cleanDestinations(allowedDestinations);
    }
    if (Array.isArray(allowedBranches)) {
      user.allowedBranches = cleanDestinations(allowedBranches);
    }
  if (status) user.status = status;
  if (password) {
    if (String(password).length < 8) return fail(res, "Parol ən azı 8 simvol olmalıdır", 400);
    user.password = await HashService.hashPassword(password);
    user.tokenVersion += 1; // force re-login everywhere on password change
  }
  await user.save();
  // Açıq socket köhnə rol/icazə ilə qalmasın — klient yenidən qoşulanda
  // handshake yeni vəziyyəti oxuyur (audit #21).
  socketService.disconnectUser(user._id);
  // Rol və icazə dəyişikliyi jurnalın ƏN VACİB hissəsidir — kimin nə vaxt
  // hansı səlahiyyəti aldığı buradan görünür. Parol dəyişikliyi də qeydə
  // düşür, amma DƏYƏRİ yox (diffDocs onu maskalayır).
  const changes = diffDocs(before, {
    firstName: user.firstName, lastName: user.lastName, phone: user.phone,
    role: user.role, status: user.status,
    permissions: user.permissions, allowedDestinations: user.allowedDestinations,
    allowedBranches: user.allowedBranches,
    ...(password ? { password: "yeni" } : {}),
  });
  await logAction(req, {
    action: "user", resource: "users", resourceId: user._id,
    summary: `İstifadəçi yeniləndi: ${user.email}`,
    changes,
  });
  ok(res, { item: publicUser(user) }, "Yeniləndi");
});

// ── DELETE /api/admin/users/:id ──
const removeUser = asyncHandler(async (req, res) => {
  if (!canManageUsers(req)) return fail(res, "Bu əməliyyat üçün super admin səlahiyyəti lazımdır", 403);
  if (String(req.params.id) === String(req.user._id)) {
    return fail(res, "Özünü silə bilməzsən", 400);
  }
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) return fail(res, "Tapılmadı", 404);

  // Yaratma və yeniləmədəki qayda silmədə də: özündən yüksək və ya bərabər
  // rütbəli hesab silinmir. Əvvəl superadmin developer-i və digər
  // superadmin-ləri silə bilirdi (audit #24).
  if (!canAssignRole(req.user?.role, user.role)) {
    return fail(res, "Bu istifadəçini silməyə icazəniz yoxdur", 403);
  }

  // Panelə girişi olan SONUNCU hesabı silməyə imkan vermirik. Əvvəl yalnız
  // "admin" rolu sayılırdı — superadmin/developer varsa admin silinə bilmirdi,
  // əksinə sonuncu developer isə asanlıqla silinirdi.
  if (["admin", "superadmin", "developer"].includes(user.role)) {
    const remaining = await User.countDocuments({
      role: { $in: ["admin", "superadmin", "developer"] },
      isDeleted: false,
      _id: { $ne: user._id },
    });
    if (remaining === 0) {
      return fail(res, "Panelə girişi olan sonuncu hesabı silmək olmaz", 400);
    }
  }
  user.isDeleted = true;
  await user.save();
  socketService.disconnectUser(user._id);
  await logAction(req, { action: "user", resource: "users", resourceId: user._id, summary: `İstifadəçi silindi: ${user.email}` });
  ok(res, null, "Silindi");
});

/**
 * GET /api/admin/logs
 *
 * Süzgəclər: `action`, `resource`, `actor` (istifadəçi id), `status`,
 * `from`/`to` (tarix), `search`.
 *
 * Əvvəl yalnız `action` və `search` vardı — «bu adam bu həftə nə etdi?»
 * sualına cavab vermək üçün bütün siyahını əl ilə gəzmək lazım gəlirdi.
 */
const listLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query, { defaultLimit: 30 });

  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resource) filter.resource = req.query.resource;
  if (req.query.status) filter.status = req.query.status;
  if (isObjectId(req.query.actor)) filter["actor.id"] = req.query.actor;

  // Tarix aralığı — Bakı günləri, `to` GÜNÜN SONUNA qədər (bax utils/bakuTime.js).
  const range = dateRange(req.query.from, req.query.to);
  if (range) filter.createdAt = range;

  if (req.query.search) {
    const rx = fuzzyRegex(req.query.search, 80);
    filter.$or = [
      { summary: rx }, { "actor.name": rx }, { "actor.email": rx },
      { resourceId: rx }, { ip: rx },
      // Dəyişən sahənin adı və dəyərləri də axtarışa düşür — «qiymət»
      // yazıb qiymət dəyişikliklərini tapmaq üçün.
      { "changes.field": rx }, { "changes.from": rx }, { "changes.to": rx },
    ];
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  ok(res, { items, pagination: pageInfo({ page, limit }, total) });
});

/**
 * GET /api/admin/logs/filters — süzgəc siyahılarının məzmunu.
 *
 * Aktyorlar/əməliyyatlar/resurslar JURNALIN ÖZÜNDƏN gəlir, sabit siyahıdan
 * yox: silinmiş istifadəçi də seçimdə qalır (onun izi jurnalda var), yeni
 * əməliyyat növü isə koda əl vurmadan görünür.
 */
// Süzgəc siyahısı bütün jurnal üzrə $group və distinct işlədir. Jurnal
// böyüdükcə hər «Loglar» açılışında bu tam skan olurdu — nəticə 2 dəqiqə
// yaddaşda saxlanılır (yeni aktyor ən geci 2 dəqiqəyə görünür) (audit #47).
const FILTERS_TTL = 2 * 60 * 1000;
let filtersCache = { at: 0, data: null };

const logFilters = asyncHandler(async (_req, res) => {
  if (filtersCache.data && Date.now() - filtersCache.at < FILTERS_TTL) {
    return ok(res, filtersCache.data);
  }
  const [actors, actions, resources] = await Promise.all([
    AuditLog.aggregate([
      { $match: { "actor.id": { $ne: null } } },
      { $group: { _id: "$actor.id", name: { $last: "$actor.name" }, email: { $last: "$actor.email" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]),
    AuditLog.distinct("action"),
    AuditLog.distinct("resource"),
  ]);

  const data = {
    actors: actors.map((a) => ({ id: String(a._id), name: a.name, email: a.email, count: a.count })),
    actions: actions.filter(Boolean).sort(),
    resources: resources.filter(Boolean).sort(),
  };
  filtersCache = { at: Date.now(), data };
  ok(res, data);
});

export { listUsers, createUser, updateUser, removeUser, listLogs, logFilters };
