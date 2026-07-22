import { requireApiUser } from "@/server/auth";
import { getCachedAnalytics } from "@/server/cached-commerce";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    return Response.json({ analytics: await getCachedAnalytics() });
  } catch (error) {
    return apiError(error, request);
  }
}
