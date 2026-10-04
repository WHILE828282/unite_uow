/* Vercel serverless function: Neon (Postgres) connection check.
   GET /api/db → { configured, connected, variable, database, server, latencyMs, help }
   Reports only names and status, never the connection string or password. */
import { neon } from "@neondatabase/serverless";

// Vercel's Neon integration sets DATABASE_URL (and POSTGRES_URL); a manual setup may use either.
const NAMES = ["DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
const pick = () => {
  for (const n of NAMES) { const v = String(process.env[n] || "").trim().replace(/^["']|["']$/g, ""); if (v) return [n, v]; }
  return [null, ""];
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const [variable, url] = pick();
  if (!url) {
    const seen = Object.keys(process.env).filter((k) => /^(DATABASE|POSTGRES|PG[A-Z]|NEON)/.test(k));
    return res.status(200).json({
      configured: false, variablesSeen: seen,
      help: "No database URL on this deployment. In Vercel: Storage → your Neon database → Connect to this project (tick Production), then Deployments → Redeploy.",
    });
  }
  const started = Date.now();
  try {
    const sql = neon(url);
    const [row] = await sql`select current_database() as database, version() as version`;
    return res.status(200).json({
      configured: true, connected: true, variable, database: row.database,
      server: String(row.version).split(" ").slice(0, 2).join(" "), latencyMs: Date.now() - started,
      help: "Neon is connected.",
    });
  } catch (e) {
    const m = String((e && e.message) || "");
    return res.status(200).json({
      configured: true, connected: false, variable,
      help: /password|auth/i.test(m) ? "The database rejected the login. Reconnect Neon in Vercel Storage and redeploy."
        : /ENOTFOUND|getaddrinfo|fetch failed/i.test(m) ? "Couldn't reach the database host. Check the connection string in Vercel."
        : "Couldn't query the database. Check the Neon project is active.",
    });
  }
}
