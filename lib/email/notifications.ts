import { resend } from './resend';

const FROM = process.env.RESEND_FROM ?? 'MyWork <noreply@mywork.app>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function greeting(name: string | null): string {
  return name ? `Hi ${name}` : 'Hi there';
}

export async function sendRegistrationPendingEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork registration is under review',
      html: `
        <p>${greeting(name)},</p>
        <p>Thank you for registering with MyWork. Your account is currently pending admin approval.</p>
        <p>We'll send you another email once your account has been reviewed.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send registration pending email to', to);
  }
}

export async function sendAccountApprovedEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork account has been approved',
      html: `
        <p>${greeting(name)},</p>
        <p>Great news — your MyWork account has been approved by an admin.</p>
        <p>You can now <a href="${APP_URL}/login">sign in here</a>.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send account approved email to', to);
  }
}

export async function sendAccountRejectedEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork registration was not approved',
      html: `
        <p>${greeting(name)},</p>
        <p>After review, your MyWork registration was not approved at this time.</p>
        <p>If you believe this is a mistake, please contact an administrator.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send account rejected email to', to);
  }
}
