import { reportRangeQuerySchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { getCachedSalesReport } from "@/server/cached-commerce";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = reportRangeQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const report = await getCachedSalesReport(query.from, query.to, query.limit);
    return Response.json({ report }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}
