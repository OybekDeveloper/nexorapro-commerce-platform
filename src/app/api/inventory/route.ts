import { inventoryMovementSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateInventory } from "@/server/cache-invalidation";
import { createInventoryMovement, listInventoryMovements } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    return Response.json({ movements: listInventoryMovements() });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const movement = createInventoryMovement(await parseJsonBody(request, inventoryMovementSchema), {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateInventory();
    return Response.json({ movement }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
