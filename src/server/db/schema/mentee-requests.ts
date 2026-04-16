import { pgTable, text, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { sessionPreferenceEnum } from "./mentor-profiles";
import { nanoid } from "nanoid";

export const requestStatusEnum = pgEnum("request_status", ["open", "matched", "cancelled"]);

export const menteeRequests = pgTable("mentee_requests", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  desiredArea: text("desired_area").notNull(),
  desiredAreaEn: text("desired_area_en"),
  desiredSkills: jsonb("desired_skills").$type<string[]>().default([]).notNull(),
  description: text("description"),
  goals: text("goals"),
  sessionPreference: sessionPreferenceEnum("session_preference").default("both"),
  status: requestStatusEnum("request_status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userStatusIdx: index("mentee_requests_user_status_idx").on(t.userId, t.status),
  tenantIdx: index("mentee_requests_tenant_idx").on(t.tenantId),
}));

export type MenteeRequest = typeof menteeRequests.$inferSelect;
export type NewMenteeRequest = typeof menteeRequests.$inferInsert;
