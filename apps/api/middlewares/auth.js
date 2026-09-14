// Lib
import { jwt } from "#lib";

// Config
import { config } from "#config";

// Constants
import { ROLE_RANK } from "#constants";

// Models
import { User } from "#models";

// Services
import { AuthTokenService } from "#services";

// Utils
import { fail, accessTokenOf, refreshTokenOf, clearAuthCookies } from "#utils";

/**
 * Authenticate an access token and attach the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    // HttpOnly cookie (panel) və ya Authorization başlığı (skript/test).
    const token = accessTokenOf(req);

    if (!token) {
      return fail(res, "Authentication required", 401);
    }

    const decoded = jwt.verify(token, config.accessSecretKey);

    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted || user.status !== "active") {
      return fail(res, "Account not found or inactive", 401);
    }

    // Check token version (for "logout all devices")
    if (decoded.tokenVersion !== user.tokenVersion) {
      return fail(res, "Session expired, please login again", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired",
        code: "TOKEN_EXPIRED",
      });
    }
    return fail(res, "Invalid token", 401);
  }
};

/**
 * Authenticate a refresh token and attach the user to req.user.
 */
const authenticateRefreshToken = async (req, res, next) => {
  // Yeniləmə alınmırsa sessiya cookie-ləri də silinir. Əks halda göstərici
  // cookie qalardı: proxy /login-dən /dashboard-a, panel isə 401 alıb yenidən
  // /login-ə yönləndirərdi — sonsuz dövrə.
  const reject = (message) => {
    clearAuthCookies(req, res);
    return fail(res, message, 401);
  };

  try {
    const token = refreshTokenOf(req);

    if (!token) {
      return reject("Refresh token required");
    }

    const decoded = jwt.verify(token, config.refreshSecretKey);

    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted || user.status !== "active") {
      return reject("Account not found");
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return reject("Session expired");
    }

    req.user = user;
    req.refreshTokenPayload = decoded;
    next();
  } catch (_error) {
    return reject("Invalid refresh token");
  }
};

/**
 * Authenticate a password-reset token (read from header or body.resetToken).
 * Attaches req.resetData and req.user.
 */
const authenticateResetToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    } else if (req.body?.resetToken) {
      token = req.body.resetToken;
    }

    if (!token) {
      return fail(res, "Reset token required", 401);
    }

    const decoded = AuthTokenService.verifyResetToken(token);

    if (!decoded) {
      return fail(res, "Invalid or expired reset token", 401);
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.isDeleted) {
      return fail(res, "Account not found", 401);
    }

    // Birdəfəlik: parol sıfırlananda tokenVersion artır. Əvvəl token 10 dəqiqə
    // ərzində istənilən qədər işlənə bilirdi — ələ keçən token parolu yenidən
    // dəyişməyə imkan verirdi (həm də sıfırlamadan sonra).
    if (decoded.tv !== (user.tokenVersion || 0)) {
      return fail(res, "Invalid or expired reset token", 401);
    }

    req.resetData = { email: decoded.email, userId: decoded.userId };
    req.user = user;
    next();
  } catch (_error) {
    return fail(res, "Invalid reset token", 401);
  }
};

/**
 * Require the authenticated user to have one of the allowed roles.
 * @param {Array<string>} allowedRoles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, "You do not have permission for this action", 403);
    }

    next();
  };
};

/**
 * Bölmə icazəsi tələb et.
 *
 * superadmin və developer bütün bölmələri görür — onlar üçün `permissions`
 * doldurulmur. Qalanlar üçün massivdə həmin bölmə olmalıdır.
 *
 * Bu, sidebar-dakı gizlətmənin SERVER qarşılığıdır: UI-da görünməyən bölmə
 * API-dən də bağlı olmalıdır, əks halda link-i bilən istifadəçi girə bilər.
 */
const requireSection = (section) => {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, "Authentication required", 401);
    }
    const role = req.user.role;
    if (role === "superadmin" || role === "developer") return next();

    const allowed = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    // Boş massiv = məhdudiyyət yoxdur (köhnə hesablar kilidlənməsin) —
    // utils/roles.js-dəki canAccessSection ilə eyni qayda.
    if (allowed.length === 0) return next();

    if (!allowed.includes(section)) {
      return fail(res, "Bu bölməyə icazəniz yoxdur", 403);
    }
    next();
  };
};

/**
 * Hədəf rolun cari istifadəçidən aşağı olduğunu yoxla.
 *
 * Bir admin özündən yüksək rol təyin edə bilməməlidir — əks halda istənilən
 * admin özünü developer edərdi.
 */
const canAssignRole = (actorRole, targetRole) =>
  (ROLE_RANK[actorRole] ?? -1) > (ROLE_RANK[targetRole] ?? 99);

export {
  requireSection,
  canAssignRole,
  authenticate,
  authenticateRefreshToken,
  authenticateResetToken,
  requireRole,
};
