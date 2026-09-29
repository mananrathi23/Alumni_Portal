import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: "a940e8001@smtp-brevo.com",
    pass: "fake_password"
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
});
transporter.verify((error, success) => {
  if (error) {
    console.log("Error length:", error.message.length);
    console.log("Error message:", error.message);
  } else {
    console.log("Server is ready");
  }
});
