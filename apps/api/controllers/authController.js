// Auth handler-lərinin toplayıcısı — marşrutlar `authController.*` adları ilə
// bağlanır, məntiq isə controllers/auth/ altındadır.

export { register, verifyOTP, resendOTP } from "./auth/registerController.js";
export { login, refreshToken, logout, getMe } from "./auth/sessionController.js";
export { changePassword, forgotPassword, verifyResetOTP, resetPassword } from "./auth/passwordController.js";
export { updateProfile, updateAvatar } from "./auth/profileController.js";
