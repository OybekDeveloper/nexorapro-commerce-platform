import { createOrderSchema, orderListQuerySchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateOrders } from "@/server/cache-invalidation";
import { createOrder, listOrdersPage } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = orderListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return Response.json(listOrdersPage(query), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await parseJsonBody(request, createOrderSchema);
    const user = await requireApiUser(input.channel === "POS" ? "admin" : undefined);
    const order = createOrder(input, user.id, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateOrders();
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
