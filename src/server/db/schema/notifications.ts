import { pgTable, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { nanoid } from "nanoid";

export const notificationTypeEnum = pgEnum("notification_type", [
  "mentor_registration_pending",
  "mentor_approved",
  "mentor_rejected",
  "new_mentoring_request",
  "request_accepted",
  "request_rejected",
  "session_scheduled",
  "session_reminder",
  "session_cancelled",
  "review_requested",
  "plan_updated",
  "plan_reminder",
]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  userId: text("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("notification_type").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  body: text("body"),
  bodyEn: text("body_en"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: text("related_entity_id"),
  isRead: boolean("is_read").default(false),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userUnreadIdx: index("notifications_user_unread_idx").on(t.userId, t.tenantId, t.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
