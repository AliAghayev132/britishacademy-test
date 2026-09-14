// Qeydiyyat — OTP göndər, təsdiqlə, yenidən göndər.

// Config
import { config } from "#config";

// Models
import { OTP, User } from "#models";

// Services
import { HashService, MailService } from "#services";

// Utils
import { fail, ok, asyncHandler } from "#utils";

// Local
import { toUserResponse, issueTokens } from "./authHelpers.js";

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

export { register, verifyOTP, resendOTP };
