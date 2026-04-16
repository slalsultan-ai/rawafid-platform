import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { matches } from "./matches";
import { tenants } from "./tenants";
import { users } from "./users";
import { nanoid } from "nanoid";

export const goalStatusEnum = pgEnum("goal_status", ["not_started", "in_progress", "completed", "deferred"]);

export const developmentPlans = pgTable("development_plans", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  matchId: text("match_id").notNull().references(() => matches.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  matchTenantIdx: index("development_plans_match_tenant_idx").on(t.matchId, t.tenantId),
}));

export const developmentGoals = pgTable("development_goals", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  planId: text("plan_id").notNull().references(() => developmentPlans.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  description: text("description"),
  status: goalStatusEnum("goal_status").default("not_started").notNull(),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  planIdx: index("development_goals_plan_idx").on(t.planId),
  tenantIdx: index("development_goals_tenant_idx").on(t.tenantId),
}));

export const goalMilestones = pgTable("goal_milestones", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  goalId: text("goal_id").notNull().references(() => developmentGoals.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  status: goalStatusEnum("milestone_status").default("not_started").notNull(),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  goalIdx: index("goal_milestones_goal_idx").on(t.goalId),
}));

export const goalProgressNotes = pgTable("goal_progress_notes", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  goalId: text("goal_id").notNull().references(() => developmentGoals.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  authorId: text("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  goalIdx: index("goal_progress_notes_goal_idx").on(t.goalId),
}));

export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type DevelopmentGoal = typeof developmentGoals.$inferSelect;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
