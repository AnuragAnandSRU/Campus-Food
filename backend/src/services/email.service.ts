import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

const isEmailConfigured = (): boolean =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

const getTransporter = (): Transporter | null => {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Sends an email. In development, if SMTP credentials are not configured,
 * the message (and any action link) is logged to the console so the auth
 * flow remains fully testable without a mail server.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  const tx = getTransporter();

  if (!tx) {
    const plain = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    console.log('\n📧 [DEV EMAIL — SMTP not configured, not actually sent]');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${plain}\n`);
    return;
  }

  await tx.sendMail({
    from: process.env.EMAIL_FROM || 'Campus Food <noreply@campusfood.com>',
    to,
    subject,
    html,
  });
};

// ---------- Templates ----------

const ACCENT = '#C4612F';
const INK = '#1F2421';
const BG = '#F7F4EF';

const wrap = (heading: string, body: string, cta?: { label: string; url: string }): string => `
  <div style="background:${BG};padding:32px 0;font-family:Inter,Arial,sans-serif;color:${INK};">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #E7E1D7;border-radius:16px;padding:32px;">
      <div style="font-size:20px;font-weight:600;color:${ACCENT};margin-bottom:16px;">🍽️ Campus Food</div>
      <h1 style="font-size:22px;margin:0 0 12px;color:${INK};">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#5C635D;">${body}</div>
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:${ACCENT};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:500;">${cta.label}</a>
             <p style="font-size:12px;color:#9A9E98;margin-top:20px;word-break:break-all;">Or paste this link into your browser:<br>${cta.url}</p>`
          : ''
      }
    </div>
    <p style="text-align:center;font-size:12px;color:#9A9E98;margin-top:16px;">© ${new Date().getFullYear()} Campus Food</p>
  </div>
`;

export const sendVerificationEmail = async (
  to: string,
  name: string,
  rawToken: string
): Promise<void> => {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
  await sendEmail({
    to,
    subject: 'Verify your Campus Food account',
    html: wrap(
      `Welcome, ${name}!`,
      'Please confirm your email address to activate your account and start ordering.',
      { label: 'Verify email', url }
    ),
  });
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  rawToken: string
): Promise<void> => {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
  await sendEmail({
    to,
    subject: 'Reset your Campus Food password',
    html: wrap(
      `Hi ${name},`,
      'We received a request to reset your password. This link expires in 1 hour. If you did not request this, you can safely ignore this email.',
      { label: 'Reset password', url }
    ),
  });
};
