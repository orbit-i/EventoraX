import { info } from "console";
import "dotenv/config";
import nodemailer from "nodemailer";


const FRONTEND_URL=process.env.FRONTEND_URL

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendResetPasswordEmail(toEmail: string, resetToken: string) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
    from: `"EventoraX" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your EventoraX password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to set a new password. This link expires in 15 minutes.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

}

export async function sendVerificationEmail(toEmail: string, rawToken: string) {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Verify your email - EventoraX",
    html: `<p>Click the link below to verify your email:</p>
           <a href="${verifyLink}">${verifyLink}</a>
           <p>This link expires in 24 hours.</p>`,
  });
}

export async function sendInviteEmail(toEmail:string,token:string) {
  const acceptUrl = `${FRONTEND_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: toEmail,
    subject: "You've been invited to join a team on EventoraX",
    html: `
      <p>You've been invited to join an organization on EventoraX.</p>
      <p><a href="${acceptUrl}">Click here to accept the invite and set up your account</a></p>
      <p>This link expires in 7 days.</p>
    `,
  });    
}