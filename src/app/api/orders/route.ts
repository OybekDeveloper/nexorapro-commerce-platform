import { createOrderSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateOrders } from "@/server/cache-invalidation";
import { createOrder, listOrders } from "@/server/commerce-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    return Response.json({ orders: listOrders() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = createOrderSchema.parse(await request.json());
    const user = await requireApiUser(input.channel === "POS" ? "admin" : undefined);
    const order = createOrder(input, user.id);
    invalidateOrders();
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
