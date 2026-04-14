import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { menteeRequests } from "./mentee-requests";
import { nanoid } from "nanoid";

export const matchStatusEnum = pgEnum("match_status", ["proposed", "accepted", "rejected", "active", "completed", "cancelled"]);

export const matches = pgTable("matches", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  mentorId: text("mentor_id").notNull().references(() => users.id),
  menteeId: text("mentee_id").notNull().references(() => users.id),
  requestId: text("request_id").references(() => menteeRequests.id),
  matchingScore: real("matching_score"),
  status: matchStatusEnum("match_status").default("proposed").notNull(),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
