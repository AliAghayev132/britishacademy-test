// Parol — unudulmuş parolun bərpası (3 addım) və daxil olmuş halda dəyişmə.

// Config
import { config } from "#config";

// Models
import { OTP, User } from "#models";

// Services
import { HashService, MailService, AuthTokenService, socketService } from "#services";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { issueTokens } from "./authHelpers.js";

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

export { changePassword, forgotPassword, verifyResetOTP, resetPassword };
