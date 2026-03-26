import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const userRoleEnum = pgEnum("user_role", ["super_admin", "org_admin", "mentor", "mentee", "employee"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  role: userRoleEnum("role").default("employee").notNull(),
  department: text("department"),
  departmentEn: text("department_en"),
  jobTitle: text("job_title"),
  jobTitleEn: text("job_title_en"),
  yearsOfExperience: integer("years_of_experience"),
  bio: text("bio"),
  bioEn: text("bio_en"),
  avatar: text("avatar"),
  language: text("language").default("ar"),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
