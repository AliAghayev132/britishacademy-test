// Auth controller-lərinin ortaq köməkçiləri — cavab forması və token cookie-ləri.

// Config
import { config } from "#config";

// Services
import { AuthTokenService } from "#services";

// Utils
import { setAuthCookies } from "#utils";

/**
 * Build the public-safe user object returned to clients.
 */
export const toUserResponse = (user) => ({
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
export const issueTokens = (req, res, user, rememberMe = false) => {
  const tokens = AuthTokenService.generateTokens(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
    rememberMe,
  );

  const refreshMaxAge = rememberMe
    ? config.rememberMeMaxAge
    : config.refreshTokenMaxAge;

  setAuthCookies(req, res, tokens, refreshMaxAge);
};
