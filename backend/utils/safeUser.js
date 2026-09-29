/**
 * utils/safeUser.js
 * Strips credentials and internal auth state from a user document before it is
 * sent to the client (login, OTP verify, password reset, profile update).
 */
const PRIVATE_FIELDS = [
  "password", "verificationCode", "verificationCodeExpire", "resetPasswordToken",
  "resetPasswordExpire", "loginAttempts", "lockUntil", "googleTokens",
];

export const safeUser = (user) => {
  const obj = typeof user?.toObject === "function" ? user.toObject() : { ...user };
  for (const field of PRIVATE_FIELDS) delete obj[field];
  return obj;
};
