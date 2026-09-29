import nodeMailer from "nodemailer";
import axios from "axios";

export const sendEmail = async ({ email, subject, message }) => {
  // If user provides a Brevo API Key, use HTTP API to bypass Railway SMTP blocks!
  if (process.env.BREVO_API_KEY) {
    const fromEmail = process.env.SMTP_FROM?.trim() || "noreply@alumniportal.com";
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: fromEmail },
        to: [{ email }],
        subject: subject,
        htmlContent: message,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY.trim(),
          "Content-Type": "application/json",
        },
      }
    );
    return;
  }

  // Fallback to standard SMTP if no API key is provided
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
