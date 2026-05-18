import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import {
  getMigrationDatabaseUrl,
  getPostgresClientOptions,
  isSupabaseTransactionPooler,
} from "./database-url";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  const databaseUrl = getMigrationDatabaseUrl();

  if (!databaseUrl) {
    if (process.env.VERCEL === "1" || process.env.CI === "true") {
      console.error(
        "Set POSTGRES_URL_NON_POOLING (Supabase session pooler, port 5432) for migrations on Vercel/CI. POSTGRES_URL with port 6543 is transaction pooler only and cannot run DDL."
      );
      process.exit(1);
    }
    const runtime = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (runtime && isSupabaseTransactionPooler(runtime)) {
      console.error(
        "POSTGRES_URL uses Supabase transaction pooler (:6543). Add POSTGRES_URL_NON_POOLING (session pooler :5432) for migrations."
      );
      process.exit(1);
    }
    console.log("No migration database URL, skipping migrations");
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
