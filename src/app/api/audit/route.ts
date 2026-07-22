import { z } from "zod";

import { requireApiUser } from "@/server/auth";
import { listAuditLogs } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  entityType: z.string().trim().min(1).max(80).optional(),
  entityId: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(120).optional(),
}).strict();

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return Response.json(listAuditLogs(query), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}
