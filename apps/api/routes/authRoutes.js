// Constants
import { Router } from "#constants";

// Controllers
import { authController } from "#controllers";

// Middlewares
import {
  authenticate,
  authenticateRefreshToken,
  authenticateResetToken,
  loginRateLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} from "#middlewares";

const AuthRouter = Router();

// Public routes
// Kod göndərən və yoxlayan marşrutlar limitlidir (bax security.js).
AuthRouter.post("/register", otpSendLimiter, authController.register);
AuthRouter.post("/verify-otp", otpVerifyLimiter, authController.verifyOTP);
AuthRouter.post("/resend-otp", otpSendLimiter, authController.resendOTP);
AuthRouter.post("/login", loginRateLimiter, authController.login);
AuthRouter.post("/forgot-password", otpSendLimiter, authController.forgotPassword);
AuthRouter.post("/verify-reset-otp", otpVerifyLimiter, authController.verifyResetOTP);
AuthRouter.post(
  "/reset-password",
  authenticateResetToken,
  authController.resetPassword,
);

// Protected routes
AuthRouter.post(
  "/refresh",
  authenticateRefreshToken,
  authController.refreshToken,
);
AuthRouter.post("/logout", authenticate, authController.logout);
AuthRouter.get("/me", authenticate, authController.getMe);
AuthRouter.put(
  "/change-password",
  authenticate,
  authController.changePassword,
);
AuthRouter.put("/profile", authenticate, authController.updateProfile);
AuthRouter.put("/avatar", authenticate, authController.updateAvatar);

export { AuthRouter };
