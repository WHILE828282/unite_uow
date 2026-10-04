/* Runs on every build (npm run build), before Vite:
   1. applies the SQL migrations in /drizzle to the database in DATABASE_URL (Neon), failing the build if that fails;
   2. seeds clubs and demo data (idempotent);
   3. the first time only, copies existing permanent data from Redis (idempotent, never overwrites).
   Without DATABASE_URL (e.g. a local build) it does nothing. */
import { migrate } from "drizzle-orm/neon-http/migrator";
import { db, databaseUrl } from "../db/client.js";

if (!databaseUrl()) {
  console.log("[db] DATABASE_URL not set: skipping migrations.");
  process.exit(0);
}
try {
  await migrate(db(), { migrationsFolder: "drizzle" });
  console.log("[db] migrations applied");
} catch (e) {
  console.error("[db] migration failed:", e && e.message);
  process.exit(1);
}
try {
  const { seed, copyFromRedis } = await import("../api/_migrate.js");
  const { getMeta } = await import("../api/_store.js");
  console.log("[db] seed", JSON.stringify(await seed()));
  if (!(await getMeta("redis_copy"))) {
    const r = await copyFromRedis();
    console.log("[db] copied from Redis", JSON.stringify(r));
  } else console.log("[db] Redis data already copied (re-run it from /admin if needed)");
} catch (e) {
  console.error("[db] seed/copy step failed (the site still deploys):", e && e.message);
}
