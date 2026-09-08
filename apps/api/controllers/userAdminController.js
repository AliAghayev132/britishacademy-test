// ── Admin user management + audit logs ──
// Create/manage multiple admin/editor accounts, and read the audit log.
// All routes are already authenticated + role-gated at the router; the write
// operations here additionally require the "admin" role (editors can't manage
// users). Passwords are hashed with HashService; password is never returned.

import { asyncHandler, fuzzyRegex, hasRole, cleanIds, isObjectId } from "#utils";
import { canAssignRole } from "#middlewares";
import { User, AuditLog } from "#models";
import { HashService, logAction, diffDocs } from "#services";
import { adminRoles, adminSections } from "#constants";

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
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = { isDeleted: false, role: { $in: adminRoles } };
  if (req.query.role && adminRoles.includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) {
    const rx = fuzzyRegex(req.query.search, 60);
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// ── POST /api/admin/users ──
const createUser = asyncHandler(async (req, res) => {
  if (!canManageUsers(req)) return res.status(403).json({ success: false, message: "Bu əməliyyat üçün super admin səlahiyyəti lazımdır" });
  const {
    firstName, lastName, email, password, phone,
    role = "editor", status = "active", permissions = [], allowedDestinations = [], allowedBranches = [],
  } = req.body || {};
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, message: "Ad, soyad, e-poçt və parol tələb olunur" });
  }
  if (String(password).length < 8) return res.status(400).json({ success: false, message: "Parol ən azı 8 simvol olmalıdır" });
  if (!adminRoles.includes(role)) return res.status(400).json({ success: false, message: "Yanlış rol" });
  // Kimsə ÖZÜNDƏN yüksək rol təyin edə bilməz — əks halda istənilən
  // superadmin özünə developer hesabı yaradardı.
  if (!canAssignRole(req.user?.role, role)) {
    return res.status(403).json({ success: false, message: "Özünüzdən yüksək və ya bərabər rol təyin edə bilməzsiniz" });
  }
  let cleanPerms;
  try {
    cleanPerms = cleanPermissions(permissions);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ success: false, message: "Bu e-poçt artıq istifadə olunur" });

  const user = await User.create({
    firstName, lastName, email, phone, role, status, permissions: cleanPerms,
    allowedDestinations: cleanDestinations(allowedDestinations),
    allowedBranches: cleanDestinations(allowedBranches),
    password: await HashService.hashPassword(password),
  });
  await logAction(req, { action: "user", resource: "users", resourceId: user._id, summary: `İstifadəçi yaradıldı: ${email} (${role})` });
  res.status(201).json({ success: true, message: "İstifadəçi yaradıldı", data: { item: publicUser(user) } });
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
  if (!canManageUsers(req)) return res.status(403).json({ success: false, message: "Bu əməliyyat üçün super admin səlahiyyəti lazımdır" });
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "Tapılmadı" });

  const { firstName, lastName, phone, role, status, password, permissions, allowedDestinations, allowedBranches } = req.body || {};

  // Özündən yüksək/bərabər istifadəçiyə toxunmaq olmaz — admin superadmin-i
  // dəyişə bilməməlidir.
  if (!canAssignRole(req.user?.role, user.role)) {
    return res.status(403).json({ success: false, message: "Bu istifadəçini dəyişməyə icazəniz yoxdur" });
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
      return res.status(403).json({ success: false, message: "Özünüzdən yüksək və ya bərabər rol təyin edə bilməzsiniz" });
    }
    user.role = role;
  }
  if (Array.isArray(permissions)) {
    try {
      user.permissions = cleanPermissions(permissions);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
    if (Array.isArray(allowedDestinations)) {
      user.allowedDestinations = cleanDestinations(allowedDestinations);
    }
    if (Array.isArray(allowedBranches)) {
      user.allowedBranches = cleanDestinations(allowedBranches);
    }
  if (status) user.status = status;
  if (password) {
    if (String(password).length < 8) return res.status(400).json({ success: false, message: "Parol ən azı 8 simvol olmalıdır" });
    user.password = await HashService.hashPassword(password);
    user.tokenVersion += 1; // force re-login everywhere on password change
  }
  await user.save();
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
  res.json({ success: true, message: "Yeniləndi", data: { item: publicUser(user) } });
});

// ── DELETE /api/admin/users/:id ──
const removeUser = asyncHandler(async (req, res) => {
  if (!canManageUsers(req)) return res.status(403).json({ success: false, message: "Bu əməliyyat üçün super admin səlahiyyəti lazımdır" });
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: "Özünü silə bilməzsən" });
  }
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "Tapılmadı" });

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
      return res.status(400).json({
        success: false,
        message: "Panelə girişi olan sonuncu hesabı silmək olmaz",
      });
    }
  }
  user.isDeleted = true;
  await user.save();
  await logAction(req, { action: "user", resource: "users", resourceId: user._id, summary: `İstifadəçi silindi: ${user.email}` });
  res.json({ success: true, message: "Silindi" });
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
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);

  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resource) filter.resource = req.query.resource;
  if (req.query.status) filter.status = req.query.status;
  if (isObjectId(req.query.actor)) filter["actor.id"] = req.query.actor;

  // Tarix aralığı. `to` GÜNÜN SONUNA qədər götürülür — əks halda «1-dən
  // 5-ə qədər» seçəndə 5-i günü ümumiyyətlə düşmürdü.
  const range = {};
  if (req.query.from) {
    const d = new Date(req.query.from);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }
  if (req.query.to) {
    const d = new Date(req.query.to);
    if (!Number.isNaN(d.getTime())) range.$lte = new Date(d.setHours(23, 59, 59, 999));
  }
  if (Object.keys(range).length) filter.createdAt = range;

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
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

/**
 * GET /api/admin/logs/filters — süzgəc siyahılarının məzmunu.
 *
 * Aktyorlar/əməliyyatlar/resurslar JURNALIN ÖZÜNDƏN gəlir, sabit siyahıdan
 * yox: silinmiş istifadəçi də seçimdə qalır (onun izi jurnalda var), yeni
 * əməliyyat növü isə koda əl vurmadan görünür.
 */
const logFilters = asyncHandler(async (_req, res) => {
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

  res.json({
    success: true,
    data: {
      actors: actors.map((a) => ({ id: String(a._id), name: a.name, email: a.email, count: a.count })),
      actions: actions.filter(Boolean).sort(),
      resources: resources.filter(Boolean).sort(),
    },
  });
});

export { listUsers, createUser, updateUser, removeUser, listLogs, logFilters };
