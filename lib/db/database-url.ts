/**
 * Runtime Postgres URL for Drizzle queries (serverless / pooled).
 * Vercel Postgres, Neon, and Supabase transaction pooler (port 6543) use `POSTGRES_URL`.
 */
export function getDatabaseUrl(): string | undefined {
  const url =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL;
  if (!url?.trim()) {
    return;
  }
  return url.trim();
}

/**
 * Migration URL — must not use Supabase transaction pooler (port 6543).
 * Set `POSTGRES_URL_NON_POOLING` (session pooler or direct) for `db:migrate` / Vercel build.
 */
export function getMigrationDatabaseUrl(): string | undefined {
  const explicit =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.SUPABASE_DB_MIGRATE_URL ??
    process.env.DATABASE_URL_MIGRATE;
  if (explicit?.trim()) {
    return explicit.trim();
  }

  const runtime = getDatabaseUrl();
  if (!runtime) {
    return;
  }

  if (isSupabaseTransactionPooler(runtime)) {
    return;
  }

  return runtime;
}

export function isSupabaseTransactionPooler(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("pooler.supabase.com") &&
    (lower.includes(":6543/") || lower.includes(":6543?"))
  );
}

/**
 * PgBouncer / Neon / Supabase poolers often break prepared statements in transaction mode.
 * `postgres.js` enables prepares by default, which works locally but can fail in production.
 */
export function shouldDisablePreparedStatements(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    process.env.VERCEL === "1" ||
    lower.includes("-pooler") ||
    lower.includes("pooler.supabase") ||
    lower.includes(".pooler.") ||
    lower.includes(":6543/") ||
    lower.includes("pgbouncer=true") ||
    lower.includes("vercel-storage.com")
  );
}

export function getPostgresClientOptions(url: string) {
  const disablePrepare = shouldDisablePreparedStatements(url);
  return {
    max: process.env.VERCEL === "1" ? 1 : 10,
    prepare: !disablePrepare,
    // Fewer round-trips on connect; helps some pooler + serverless setups.
    fetch_types: !disablePrepare,
  } as const;
}
