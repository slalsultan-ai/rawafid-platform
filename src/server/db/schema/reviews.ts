import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { users } from "./users";

export const sessionReviews = pgTable("session_reviews", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
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
