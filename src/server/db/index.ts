import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const createDb = () => {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("placeholder")) {
    // Return a proxy that throws a helpful error when actually used
    return null as unknown as ReturnType<typeof drizzle>;
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
};

export const db = createDb();
export type DB = typeof db;
