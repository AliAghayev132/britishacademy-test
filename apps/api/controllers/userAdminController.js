// ── Admin user management + audit logs ──
// Create/manage multiple admin/editor accounts, and read the audit log.
// All routes are already authenticated + role-gated at the router; the write
// operations here additionally require the "admin" role (editors can't manage
// users). Passwords are hashed with HashService; password is never returned.

import { asyncHandler, fuzzyRegex, hasRole } from "#utils";
import { canAssignRole } from "#middlewares";
import { User, AuditLog } from "#models";
import { HashService, logAction } from "#services";
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
  Array.isArray(v) ? v.filter((id) => /^[a-fd]{24}$/i.test(String(id))) : [];

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
  const cleanPerms = (Array.isArray(permissions) ? permissions : []).filter((x) =>
    adminSections.includes(x),
  );

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
    user.permissions = permissions.filter((x) => adminSections.includes(x));
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
  await logAction(req, { action: "user", resource: "users", resourceId: user._id, summary: `İstifadəçi yeniləndi: ${user.email}` });
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

// ── GET /api/admin/logs ──
const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.resource) filter.resource = req.query.resource;
  if (req.query.search) {
    const rx = fuzzyRegex(req.query.search, 80);
    filter.$or = [{ summary: rx }, { "actor.name": rx }, { "actor.email": rx }];
  }
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export { listUsers, createUser, updateUser, removeUser, listLogs };
