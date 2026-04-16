import { pgTable, text, timestamp, integer, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { matches } from "./matches";
import { tenants } from "./tenants";
import { users } from "./users";
import { nanoid } from "nanoid";

export const sessionStatusEnum = pgEnum("session_status", ["scheduled", "preparing", "completed", "cancelled"]);
export const sessionTypeEnum = pgEnum("session_type", ["virtual", "in_person"]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  matchId: text("match_id").notNull().references(() => matches.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  type: sessionTypeEnum("session_type").default("virtual").notNull(),
  locationOrLink: text("location_or_link"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  status: sessionStatusEnum("session_status").default("scheduled").notNull(),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  matchIdx: index("sessions_match_idx").on(t.matchId),
  tenantStatusIdx: index("sessions_tenant_status_idx").on(t.tenantId, t.status),
}));

export const sessionAgendaItems = pgTable("session_agenda_items", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  addedBy: text("added_by").notNull().references(() => users.id),
  content: text("content").notNull(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionNotes = pgTable("session_notes", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  authorId: text("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionSummaries = pgTable("session_summaries", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  authorId: text("author_id").notNull().references(() => users.id),
  discussedPoints: text("discussed_points"),
  decisions: text("decisions"),
  actionItems: text("action_items"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type SessionAgendaItem = typeof sessionAgendaItems.$inferSelect;
export type SessionNote = typeof sessionNotes.$inferSelect;
export type SessionSummary = typeof sessionSummaries.$inferSelect;
