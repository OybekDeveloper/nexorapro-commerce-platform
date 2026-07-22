import { database } from "@/server/database";

export const dynamic = "force-dynamic";

export function GET() {
  const databaseCheck = database.prepare("SELECT 1 AS ok").get() as { ok: number };
  const migration = database.prepare("SELECT COALESCE(MAX(version), 0) AS version, COUNT(*) AS count FROM schema_migrations").get() as { version: number; count: number };
  return Response.json({ status: "ok", service: "nexorapro-commerce-api", database: databaseCheck.ok === 1, schema: migration, timestamp: new Date().toISOString() });
}
