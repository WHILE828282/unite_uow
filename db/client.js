/* Postgres connection for the API routes (server only: never import this from src/).
   Neon's HTTP driver: one short request per query, no connection pool to manage on Vercel.
   Tests can inject another Drizzle database (e.g. PGlite) through globalThis.__uniteTestDb. */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const URL_NAMES = ["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"];
export const databaseUrl = () => {
  for (const n of URL_NAMES) { const v = String(process.env[n] || "").trim().replace(/^["']|["']$/g, ""); if (v) return v; }
  return "";
};
export const dbConfigured = () => !!(globalThis.__uniteTestDb || databaseUrl());

let cached = null;
export const db = () => {
  if (globalThis.__uniteTestDb) return globalThis.__uniteTestDb;
  if (!cached) {
    const url = databaseUrl();
    if (!url) throw new Error("DATABASE_URL is not set");
    cached = drizzle(neon(url), { schema });
  }
  return cached;
};
export { schema };
