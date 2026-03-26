import { pgTable, text, timestamp, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";

export const mentorStatusEnum = pgEnum("mentor_status", ["pending", "approved", "rejected"]);
export const sessionPreferenceEnum = pgEnum("session_preference", ["virtual", "in_person", "both"]);

export const mentorProfiles = pgTable("mentor_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  areasOfExpertise: jsonb("areas_of_expertise").$type<Array<{ id: string; nameAr: string; nameEn: string }>>().default([]).notNull(),
  skills: jsonb("skills").$type<Array<{ id: string; nameAr: string; nameEn: string }>>().default([]).notNull(),
  availability: jsonb("availability").$type<Array<{ day: string; from: string; to: string }>>().default([]).notNull(),
  maxMentees: integer("max_mentees").default(3),
  sessionPreference: sessionPreferenceEnum("session_preference").default("both"),
  motivation: text("motivation"),
  motivationEn: text("motivation_en"),
  status: mentorStatusEnum("mentor_status").default("pending").notNull(),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  averageRating: integer("average_rating"),
  totalRatings: integer("total_ratings").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type NewMentorProfile = typeof mentorProfiles.$inferInsert;
