import { defineConfig } from "prisma/config";
import { ensureDatabaseUrl } from "./lib/database-url";

const databaseUrl = ensureDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: databaseUrl },
});
