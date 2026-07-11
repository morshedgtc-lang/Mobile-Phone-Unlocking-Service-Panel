import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (!config.smtpUser) {
    console.log(`[OTP] Code for ${email}: ${code}`);
    return;
  }

  await transporter.sendMail({
    from: config.smtpUser,
    to: email,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in ${config.otpExpiryMinutes} minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!config.smtpUser) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: config.smtpUser,
    to,
    subject,
    html,
  });
}
