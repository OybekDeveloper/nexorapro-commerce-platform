import { getOptionalUser } from "@/server/auth";

export async function GET() {
  return Response.json({ user: await getOptionalUser() }, { headers: { "Cache-Control": "private, no-store" } });
}
