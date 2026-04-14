import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM ?? "Rawafid <noreply@rawafid.test>";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey || apiKey.includes("placeholder")) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; reason?: string }> {
  const c = getClient();
  if (!c) {
    console.info(`[email] (dry-run) → ${msg.to} :: ${msg.subject}`);
    return { ok: false, reason: "resend_not_configured" };
  }
  try {
    await c.emails.send({ from: fromAddress, to: msg.to, subject: msg.subject, html: msg.html });
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, reason: "send_failed" };
  }
}

export function renderTemplate(title: string, body: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<p style="margin:24px 0;"><a href="${ctaUrl}" style="background:#0f2837;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${ctaLabel}</a></p>`
    : "";
  return `<!doctype html><html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <h1 style="color:#0f2837;margin:0 0 16px 0;font-size:22px;">${title}</h1>
      <div style="color:#475569;line-height:1.6;font-size:15px;">${body}</div>
      ${cta}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="color:#94a3b8;font-size:12px;margin:0;">منصة روافد للإرشاد المهني</p>
    </div>
  </body></html>`;
}
