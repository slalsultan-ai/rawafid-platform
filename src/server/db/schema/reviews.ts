import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { tenants } from "./tenants";
import { users } from "./users";
import { nanoid } from "nanoid";

export const sessionReviews = pgTable("session_reviews", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  reviewerId: text("reviewer_id").notNull().references(() => users.id),
  revieweeId: text("reviewee_id").notNull().references(() => users.id),
  overallRating: integer("overall_rating").notNull(),
  ratingBenefit: integer("rating_benefit"),
  ratingPreparation: integer("rating_preparation"),
  ratingPunctuality: integer("rating_punctuality"),
  ratingCommunication: integer("rating_communication"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SessionReview = typeof sessionReviews.$inferSelect;
