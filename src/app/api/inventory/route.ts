import { inventoryMovementSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateInventory } from "@/server/cache-invalidation";
import { createInventoryMovement, listInventoryMovements } from "@/server/commerce-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    return Response.json({ movements: listInventoryMovements() });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const movement = createInventoryMovement(inventoryMovementSchema.parse(await request.json()));
    invalidateInventory();
    return Response.json({ movement }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
