import { inventoryReservationSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateInventory } from "@/server/cache-invalidation";
import { createInventoryReservation, listInventoryReservations } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    return Response.json({ reservations: listInventoryReservations() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const reservation = createInventoryReservation(await parseJsonBody(request, inventoryReservationSchema), {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateInventory();
    return Response.json({ reservation }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
