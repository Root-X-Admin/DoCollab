import dotenv from "dotenv";
dotenv.config(); // make sure env vars are available in this module

import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env;

// Optional: quick debug to confirm values
console.log("MAILER CONFIG:", {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER: SMTP_USER ? "SET" : "MISSING",
});

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: false, // TLS is upgraded via STARTTLS on 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Nodemailer sendEmail error:", err);
    throw err;
  }
}
