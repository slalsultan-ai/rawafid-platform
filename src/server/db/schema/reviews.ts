import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
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
}, (t) => ({
  sessionIdx: index("session_reviews_session_idx").on(t.sessionId),
  tenantRevieweeIdx: index("session_reviews_tenant_reviewee_idx").on(t.tenantId, t.revieweeId),
}));

export type SessionReview = typeof sessionReviews.$inferSelect;
