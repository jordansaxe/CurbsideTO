import "server-only";
import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, { max: 5, onnotice: () => {} });
}

// Reuse one pool across hot reloads in development.
export const sql = globalForDb.sql ?? (globalForDb.sql = connect());
