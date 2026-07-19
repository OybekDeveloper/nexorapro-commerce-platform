import { orderStatusSchema } from "@/lib/commerce";
import { getOrder, updateOrderStatus } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const order = getOrder(decodeURIComponent(id));
  return order ? Response.json({ order }) : Response.json({ error: "Buyurtma topilmadi" }, { status: 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { status?: unknown };
    const order = updateOrderStatus(decodeURIComponent(id), orderStatusSchema.parse(body.status));
    return order ? Response.json({ order }) : Response.json({ error: "Buyurtma topilmadi" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}
