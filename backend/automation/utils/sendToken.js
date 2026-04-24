// For Login
export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  // ✅ Get role from Mongoose model name (Student, Teacher, Alumni, Admin)
  const role = user.constructor.modelName;

  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    })
    .json({
      success: true,
      user: { ...user.toObject(), role }, // ✅ role injected here
      message,
      token,
    });
};