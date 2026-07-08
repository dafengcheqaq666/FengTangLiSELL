import { getConnectionString } from "@netlify/database";

const localDatabaseUrl = "postgresql://store:store@localhost:5432/store?schema=public";

export function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NETLIFY === "true") return getConnectionString();
  return localDatabaseUrl;
}

export function ensureDatabaseUrl() {
  process.env.DATABASE_URL = resolveDatabaseUrl();
  return process.env.DATABASE_URL;
}
