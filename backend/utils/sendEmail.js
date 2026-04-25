import nodeMailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    service: process.env.SMTP_SERVICE?.trim(),
    port: process.env.SMTP_PORT?.trim(),
    secure: process.env.SMTP_PORT?.trim() == "465", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_MAIL?.trim(),
      pass: process.env.SMTP_PASSWORD?.trim(),
    },
    connectionTimeout: 10000, // 10 seconds max wait
    greetingTimeout: 5000,
  });

  const options = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html: message,
  };
  await transporter.sendMail(options);
};
