import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const createDb = (): Db | null => {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("placeholder")) return null;
  const sql = neon(url);
  return drizzle(sql, { schema });
};

export const db = createDb();
export type DB = NonNullable<typeof db>;
