// Drizzle Kit: `npm run db:generate` writes SQL migrations to /drizzle from db/schema.js.
export default {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "" },
};
