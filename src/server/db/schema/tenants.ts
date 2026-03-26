import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  settings: jsonb("settings").$type<{
    maxMenteesPerMentor?: number;
    allowSameDepartmentMatch?: boolean;
    matchingWeights?: {
      domain: number;
      skills: number;
      experience: number;
      availability: number;
      rating: number;
    };
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
