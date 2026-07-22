import { orderStatusSchema } from "@/lib/commerce";
import { z } from "zod";
import { requireApiUser } from "@/server/auth";
import { invalidateOrders } from "@/server/cache-invalidation";
import { getOrder, updateOrderStatus } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, HttpError, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    await requireApiUser("admin");
    const { id } = await context.params;
    const order = getOrder(decodeURIComponent(id));
    if (!order) throw new HttpError(404, "Buyurtma topilmadi");
    return Response.json({ order });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const { id } = await context.params;
    const body = await parseJsonBody(request, z.object({ status: orderStatusSchema }).strict());
    const order = updateOrderStatus(decodeURIComponent(id), body.status, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    if (!order) throw new HttpError(404, "Buyurtma topilmadi");
    invalidateOrders();
    return Response.json({ order });
  } catch (error) {
    return apiError(error, request);
  }
}
