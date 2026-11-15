import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";

import { getDatabasePool, isDatabaseConfigured } from "./pool";
import { seedDatabase } from "./seed";

let hasInitialized = false;

export async function ensureDatabaseSchema(poolInstance?: Pool): Promise<boolean> {
  if (!isDatabaseConfigured() && !poolInstance) {
    return false;
  }

  if (hasInitialized && !poolInstance) {
    return true;
  }

  const pool = poolInstance ?? getDatabasePool();

  try {
    // Check if tables already exist
    const checkResult = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'posts'
      );
    `);

    const tablesExist = checkResult.rows[0]?.exists ?? false;

    if (!tablesExist) {
      // Load and execute schema.sql
      const schemaPath = join(process.cwd(), "src/server/db/schema.sql");
      const ddl = readFileSync(schemaPath, "utf8");
      await pool.query(ddl);

      // Seed default Director, Teacher, and meeting notice
      await seedDatabase(pool);
    }

    hasInitialized = true;
    return true;
  } catch (error) {
    console.error("[Database Schema Init Failed]", error);
    return false;
  }
}
