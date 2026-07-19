import { orderStatusSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateOrders } from "@/server/cache-invalidation";
import { getOrder, updateOrderStatus } from "@/server/commerce-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireApiUser("admin");
    const { id } = await context.params;
    const order = getOrder(decodeURIComponent(id));
    return order ? Response.json({ order }) : Response.json({ error: "Buyurtma topilmadi" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const { id } = await context.params;
    const body = await request.json() as { status?: unknown };
    const order = updateOrderStatus(decodeURIComponent(id), orderStatusSchema.parse(body.status));
    if (!order) return Response.json({ error: "Buyurtma topilmadi" }, { status: 404 });
    invalidateOrders();
    return Response.json({ order });
  } catch (error) {
    return apiError(error);
  }
}
