import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __intila9aPgPool: Pool | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

function getDatabaseSslConfig(): boolean | { rejectUnauthorized: boolean } {
  const dbUrl = process.env.DATABASE_URL ?? "";

  // If local development or explicit disable, omit SSL
  if (
    dbUrl.includes("localhost") ||
    dbUrl.includes("127.0.0.1") ||
    dbUrl.includes("sslmode=disable")
  ) {
    return false;
  }

  // Cloud providers like Neon, Supabase, Vercel Postgres require SSL
  return { rejectUnauthorized: false };
}

export function getDatabasePool(): Pool {
  if (globalThis.__intila9aPgPool) {
    return globalThis.__intila9aPgPool;
  }

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_NOT_CONFIGURED: DATABASE_URL is not set.");
  }

  const connectionString = process.env.DATABASE_URL;
  const ssl = getDatabaseSslConfig();

  globalThis.__intila9aPgPool = new Pool({
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  globalThis.__intila9aPgPool.on("error", (err) => {
    console.error("[Database Pool Error]", err);
  });

  return globalThis.__intila9aPgPool;
}

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[],
): Promise<QueryResult<R>> {
  const pool = getDatabasePool();
  return pool.query<R>(text, params ? [...params] : undefined);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
