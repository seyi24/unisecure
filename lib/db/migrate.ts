import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getDatabaseUrl, getPostgresClientOptions } from "./database-url";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    if (process.env.VERCEL === "1" || process.env.CI === "true") {
      console.error(
        "POSTGRES_URL or DATABASE_URL must be set for migrations on Vercel/CI."
      );
      process.exit(1);
    }
    console.log("No POSTGRES_URL or DATABASE_URL, skipping migrations");
    process.exit(0);
  }

  const connection = postgres(databaseUrl, {
    ...getPostgresClientOptions(databaseUrl),
    max: 1,
  });
  const db = drizzle(connection);

  console.log("Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
