import { requireApiUser } from "@/server/auth";
import { listOrdersByUser } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    return Response.json({ orders: listOrdersByUser(user.id) }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error, request);
  }
}
