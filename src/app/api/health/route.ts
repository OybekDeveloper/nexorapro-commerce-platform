import { database } from "@/server/database";

export const dynamic = "force-dynamic";

export function GET() {
  const databaseCheck = database.prepare("SELECT 1 AS ok").get() as { ok: number };
  return Response.json({ status: "ok", service: "nexorapro-commerce-api", database: databaseCheck.ok === 1, timestamp: new Date().toISOString() });
}
