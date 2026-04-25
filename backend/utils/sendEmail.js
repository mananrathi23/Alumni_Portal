import nodeMailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  const config = {
    host: process.env.SMTP_HOST?.trim(),
    port: process.env.SMTP_PORT?.trim(),
    secure: process.env.SMTP_PORT?.trim() == "465",
    auth: {
      user: process.env.SMTP_MAIL?.trim(),
      pass: process.env.SMTP_PASSWORD?.trim(),
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  };

  const transporter = nodeMailer.createTransport(config);

  const options = {
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_MAIL?.trim(),
    to: email,
    subject,
    html: message,
  };
  await transporter.sendMail(options);
};
