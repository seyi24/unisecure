/**
 * Resolves the Postgres connection string for Drizzle, migrations, and queries.
 * Vercel Postgres and Neon typically expose `POSTGRES_URL`; other hosts often use `DATABASE_URL`.
 */
export function getDatabaseUrl(): string | undefined {
  const url =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL;
  if (!url?.trim()) {
    return;
  }
  return url.trim();
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
