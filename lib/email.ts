/**
 * Email utility for sending transactional emails (password reset OTPs).
 *
 * Uses nodemailer with generic SMTP configuration.
 * For development: Gmail + App Password.
 * For production: any transactional email provider (Resend, SES, etc.).
 *
 * Server-only — never import this file in a Client Component.
 */

import nodemailer from "nodemailer";

// ─── SMTP Configuration ──────────────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP environment variables are not configured. " +
        "Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env.local file."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/** Cached transporter — created once per serverless function lifetime. */
let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

// ─── Email Sender ─────────────────────────────────────────────────────────────

/**
 * Sends a password-reset OTP email.
 *
 * @param to   — recipient email address
 * @param otp  — the 6-digit OTP (plaintext, for the email body only)
 *
 * Does NOT log the OTP. Throws on send failure — the caller handles errors.
 */
export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const from =
    process.env.SMTP_FROM || "Campus Connect <noreply@campusconnect.app>";
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: "Campus Connect — Password Reset Code",
    text: [
      "Campus Connect — Password Reset",
      "",
      `Your verification code is: ${otp}`,
      "",
      "This code expires in 5 minutes.",
      "If you did not request a password reset, you can safely ignore this email.",
      "",
      "— Campus Connect",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1e293b; font-size: 22px; margin: 0;">Campus Connect</h1>
          <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">Password Reset</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; padding: 12px 0;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0;">This code expires in 5 minutes.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
