import { z } from "zod";

import { requireApiUser } from "@/server/auth";
import { getCachedInventoryReport } from "@/server/cached-commerce";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  threshold: z.coerce.number().int().min(0).max(10_000).default(5),
}).strict();

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const report = await getCachedInventoryReport(query.threshold);
    return Response.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}
