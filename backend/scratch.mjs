import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: "a940e8001@smtp-brevo.com",
    pass: "fake" // I don't have the real password, so I can't test actual sending!
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
});
