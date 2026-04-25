// For Login
export const sendToken = (user, statusCode, message, res, keepSignedIn = false) => {
  const token = user.generateToken();
  const role  = user.constructor.modelName;

  // keepSignedIn = true  → 30 days (long session)
  // keepSignedIn = false → COOKIE_EXPIRE days (default: 7 days, session-ish)
  const daysToExpire = keepSignedIn
    ? 30
    : Number(process.env.COOKIE_EXPIRE) || 7;

  res
    .status(statusCode)
    .cookie("token", token, {
      expires:  new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .json({
      success: true,
      user: { ...user.toObject(), role },
      message,
      token,
      keepSignedIn,
    });
};
