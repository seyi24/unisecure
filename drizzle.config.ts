import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import {
  getDatabaseUrl,
  getMigrationDatabaseUrl,
} from "./lib/db/database-url";

config({
  path: ".env.local",
});

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl() ?? getDatabaseUrl() ?? "",
  },
});
