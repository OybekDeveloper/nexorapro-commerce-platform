import { getAnalytics } from "@/server/commerce-repository";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ analytics: getAnalytics() });
}
