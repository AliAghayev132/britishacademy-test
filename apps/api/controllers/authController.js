// Config
import { config } from "#config";

// Constants
import { uploadPaths } from "#constants";

// Models
import { OTP, User } from "#models";

// Services
import {
  FileService,
  HashService,
  MailService,
  AuthTokenService,
  logAction,
  socketService,
} from "#services";

// Utils
import {
  fail,
  ok,
  asyncHandler,
  accessTokenOf,
  refreshTokenOf,
  setAuthCookies,
  clearAuthCookies,
} from "#utils";

/**
 * Build the public-safe user object returned to clients.
 */
const toUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  // Sidebar hansı bölmələri göstərəcəyini bundan bilir. superadmin/developer
  // üçün boş gəlir — onlar hər şeyi görür (client tərəfdə rola baxılır).
  permissions: user.permissions || [],
});

/**
 * Issue tokens for a user as httpOnly cookies.
 *
 * Tokenlər cavabın GÖVDƏSİNDƏ qaytarılmır — brauzer JS-i onları heç görmür
 * (audit #2, bax utils/authCookies.js).
 */
const issueTokens = (req, res, user, rememberMe = false) => {
  const tokens = AuthTokenService.generateTokens(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
    rememberMe,
  );

  const refreshMaxAge = rememberMe
    ? config.rememberMeMaxAge
    : config.refreshTokenMaxAge;

  setAuthCookies(req, res, tokens, refreshMaxAge);
};

/**
 * Step 1: Send OTP for registration
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return fail(res, "Please fill in all required fields", 400);
  }

  if (password.length < 8) {
    return fail(res, "Password must be at least 8 characters", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return fail(res, "This email is already registered", 400);
  }

  // Hash the password now; store it in the OTP payload until verification.
  const hashedPassword = await HashService.hashPassword(password);

  const otp = await OTP.createOTP(email, "register", {
    firstName,
    lastName,
    phone: phone || null,
    hashedPassword,
  });

  const emailResult = await MailService.sendOTP(email, otp.code, "register");

  if (!emailResult.success) {
    await OTP.deleteOne({ _id: otp._id });
    return fail(res, "Could not send email. Please try again", 500);
  }

  ok(res, { email: email.toLowerCase(), expiresIn: config.otpExpiresIn }, "Verification code sent to your email", 200);
});

/**
 * Step 2: Verify OTP and create the user
 * POST /api/auth/verify-otp
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return fail(res, "Email and verification code are required", 400);
  }

  const verification = await OTP.verifyOTP(email, code, "register");

  if (!verification.valid) {
    return fail(res, verification.error, 400);
  }

  const data = verification.data;

  // Create the user from the stored OTP payload.
  const user = await User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: email.toLowerCase(),
    password: data.hashedPassword,
    phone: data.phone || null,
  });

  await OTP.deleteMany({ email: email.toLowerCase(), type: "register" });

  // Fire-and-forget welcome email (do not block the response on it).
  MailService.sendWelcome(user.email, user.firstName).catch(() => {});

  issueTokens(req, res, user);

  ok(res, { user: toUserResponse(user) }, "Registration completed successfully", 201);
});

/**
 * Resend OTP code
 * POST /api/auth/resend-otp
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email, type = "register" } = req.body;

  if (!email) {
    return fail(res, "Email is required", 400);
  }

  const existingOTP = await OTP.findOne({
    email: email.toLowerCase(),
    type,
    verified: false,
  });

  if (!existingOTP) {
    return fail(res, "No pending verification found. Please start again", 400);
  }

  const otp = await OTP.createOTP(email, type, existingOTP.data);
  const emailResult = await MailService.sendOTP(email, otp.code, type);

  if (!emailResult.success) {
    return fail(res, "Could not send email", 500);
  }

  ok(res, { email: email.toLowerCase(), expiresIn: config.otpExpiresIn }, "A new verification code has been sent");
});

/**
 * Login
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return fail(res, "Email and password are required", 400);
  }

  // Parol `select: false`-dur — müqayisə üçün açıq şəkildə istənilir.
  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeleted: false,
  }).select("+password");

  if (!user) {
    // UĞURSUZ CƏHDLƏR DƏ YAZILIR: yalnız uğurlu girişləri saxlamaq
    // təhlükəsizlik jurnalını mənasız edir — hesabın seçilib-seçilmədiyi
    // məhz uğursuz cəhdlərdən görünür.
    await logAction(req, {
      action: "login", status: "fail", reason: "Belə istifadəçi yoxdur",
      summary: `Uğursuz giriş: ${email}`,
      actor: { email: String(email).toLowerCase() },
    });
    return fail(res, "Invalid email or password", 401);
  }

  const isMatch = await HashService.comparePassword(password, user.password);
  if (!isMatch) {
    await logAction(req, {
      action: "login", status: "fail", reason: "Şifrə yanlışdır",
      summary: `Uğursuz giriş: ${user.email}`,
      actor: user,
    });
    return fail(res, "Invalid email or password", 401);
  }

  if (user.status !== "active") {
    await logAction(req, {
      action: "login", status: "fail", reason: `Hesab aktiv deyil (${user.status})`,
      summary: `Uğursuz giriş: ${user.email}`,
      actor: user,
    });
    return fail(res, "Your account is not active", 403);
  }

  user.lastLogin = new Date();
  await user.save();

  await logAction(req, { action: "login", summary: `Giriş: ${user.email}`, actor: user });

  issueTokens(req, res, user, !!rememberMe);

  ok(res, { user: toUserResponse(user) }, "Login successful");
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;

  // Detect rememberMe by inspecting the old refresh token's lifetime
  // (authenticateRefreshToken artıq yoxlayıb).
  const decoded = req.refreshTokenPayload;
  const tokenLifeMs =
    decoded?.exp && decoded?.iat ? (decoded.exp - decoded.iat) * 1000 : 0;
  const rememberMe = tokenLifeMs > 7 * 24 * 60 * 60 * 1000;

  issueTokens(req, res, user, rememberMe);

  ok(res, { user: toUserResponse(user) });
});

/**
 * Logout (invalidate all tokens on all devices)
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // `authenticate` olmadan: access token 15 dəqiqədə bitir, o qapı olsaydı
  // bitmiş sessiyada çıxış 401 alar və cookie-lər brauzerdə qalardı. Ona görə
  // access və ya refresh tokendən biri etibarlıdırsa sessiya bağlanır,
  // cookie-lər isə HƏR HALDA silinir.
  const decoded =
    AuthTokenService.verifyAccessToken(accessTokenOf(req)) ||
    AuthTokenService.verifyRefreshToken(refreshTokenOf(req));
  const user = decoded?.id ? await User.findById(decoded.id) : null;

  clearAuthCookies(req, res);

  if (user && decoded.tokenVersion === user.tokenVersion) {
    user.tokenVersion += 1;
    await user.save();
    socketService.disconnectUser(user._id);
    req.user = user;
    await logAction(req, { action: "logout", summary: `Çıxış: ${user.email}` });
  }

  ok(res, null, "Logout successful");
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  ok(res, { user: toUserResponse(user) });
});

/**
 * Change password (while logged in)
 * PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return fail(res, "Current and new password are required", 400);
  }

  if (newPassword.length < 8) {
    return fail(res, "New password must be at least 8 characters", 400);
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await HashService.comparePassword(
    currentPassword,
    user.password,
  );
  if (!isMatch) {
    return fail(res, "Current password is incorrect", 401);
  }

  user.password = await HashService.hashPassword(newPassword);
  user.tokenVersion += 1; // invalidate existing sessions
  await user.save();
  socketService.disconnectUser(user._id);

  // Digər cihazlar çıxarılır, bu brauzer yeni cookie-lərlə davam edir.
  issueTokens(req, res, user);

  ok(res, null, "Password changed successfully");
});

/**
 * Forgot password - Step 1: send OTP
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return fail(res, "Email is required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to avoid email enumeration.
  if (!user) {
    return ok(res, { email: email.toLowerCase(), expiresIn: config.otpExpiresIn }, "If this email exists, a reset code has been sent");
  }

  const otp = await OTP.createOTP(email, "reset-password", { userId: user._id });
  const emailResult = await MailService.sendOTP(
    email,
    otp.code,
    "reset-password",
  );

  if (!emailResult.success) {
    await OTP.deleteOne({ _id: otp._id });
    return fail(res, "Could not send email. Please try again", 500);
  }

  ok(res, { email: email.toLowerCase(), expiresIn: config.otpExpiresIn }, "Reset code sent to your email");
});

/**
 * Forgot password - Step 2: verify OTP, return reset token
 * POST /api/auth/verify-reset-otp
 */
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return fail(res, "Email and verification code are required", 400);
  }

  const verification = await OTP.verifyOTP(email, code, "reset-password");

  if (!verification.valid) {
    return fail(res, verification.error, 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return fail(res, "User not found", 404);
  }

  await OTP.deleteMany({ email: email.toLowerCase(), type: "reset-password" });

  const resetToken = AuthTokenService.generateResetToken({
    email: email.toLowerCase(),
    userId: user._id,
    // Parol dəyişəndə tokenVersion artır — token təkrar işlədilə bilmir.
    tv: user.tokenVersion || 0,
  });

  ok(res, { resetToken }, "OTP verified");
});

/**
 * Forgot password - Step 3: reset password (protected by reset token)
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = req.user;

  if (!newPassword) {
    return fail(res, "New password is required", 400);
  }

  if (newPassword.length < 8) {
    return fail(res, "Password must be at least 8 characters", 400);
  }

  user.password = await HashService.hashPassword(newPassword);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  ok(res, null, "Password reset successfully");
});

/**
 * Update profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return fail(res, "User not found", 404);
  }

  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (phone !== undefined) user.phone = phone;

  await user.save();

  ok(res, { user: toUserResponse(user) }, "Profil yeniləndi");
});

/**
 * Update avatar (FileService upload example)
 * PUT /api/auth/avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.avatar) {
    return fail(res, "Avatar file is required", 400);
  }

  const user = await User.findById(req.user._id);

  // Remove the previous avatar file if present.
  if (user.avatar) {
    FileService.deleteFile(user.avatar);
  }

  const savedFile = await FileService.saveFile(
    req.files.avatar,
    `${uploadPaths.avatars.replace("uploads/", "")}/${user._id}`,
  );

  user.avatar = savedFile.path;
  await user.save();

  ok(res, { avatar: user.avatar }, "Avatar updated");
});

export {
  register,
  verifyOTP,
  resendOTP,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  updateProfile,
  updateAvatar,
};
