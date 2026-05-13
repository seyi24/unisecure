/**
 * Resolves the Postgres connection string for Drizzle, migrations, and queries.
 * Vercel Postgres and Neon typically expose `POSTGRES_URL`; other hosts often use `DATABASE_URL`.
 */
export function getDatabaseUrl(): string | undefined {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
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
    lower.includes(":6543/") ||
    lower.includes("pgbouncer=true")
  );
}

export function getPostgresClientOptions(url: string) {
  return {
    max: process.env.VERCEL === "1" ? 1 : 10,
    prepare: !shouldDisablePreparedStatements(url),
  } as const;
}
