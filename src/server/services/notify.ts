import { db } from "@/server/db";
import { notifications, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, renderTemplate } from "./email";

type NotificationType =
  | "mentor_registration_pending"
  | "mentor_approved"
  | "mentor_rejected"
  | "new_mentoring_request"
  | "request_accepted"
  | "request_rejected"
  | "session_scheduled"
  | "session_reminder"
  | "session_cancelled"
  | "review_requested"
  | "plan_updated"
  | "plan_reminder";

export interface NotifyInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleEn?: string;
  body?: string;
  bodyEn?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  ctaUrl?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  if (!db) return;
  let emailSent = false;
  try {
    const recipient = await db
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1)
      .then((r) => r[0]);

    if (recipient?.email) {
      const result = await sendEmail({
        to: recipient.email,
        subject: input.title,
        html: renderTemplate(
          input.title,
          input.body ?? "",
          input.ctaUrl ? "فتح روافد" : undefined,
          input.ctaUrl
        ),
      });
      emailSent = result.ok;
    }
  } catch (err) {
    console.error("[notify] email failed", err);
  }

  try {
    await db.insert(notifications).values({
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      titleEn: input.titleEn,
      body: input.body,
      bodyEn: input.bodyEn,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      isRead: false,
      emailSent,
    });
  } catch (err) {
    console.error("[notify] insert failed", err);
  }
}
