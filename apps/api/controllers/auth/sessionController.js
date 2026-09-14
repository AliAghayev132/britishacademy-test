// Sessiya — giriş, token yeniləmə, çıxış, cari istifadəçi.

// Models
import { User } from "#models";

// Services
import { HashService, AuthTokenService, logAction, socketService } from "#services";

// Utils
import { fail, ok, asyncHandler, accessTokenOf, refreshTokenOf, clearAuthCookies } from "#utils";

// Local
import { toUserResponse, issueTokens } from "./authHelpers.js";

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

export { login, refreshToken, logout, getMe };
