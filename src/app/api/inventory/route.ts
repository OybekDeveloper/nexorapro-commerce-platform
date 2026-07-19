import { revalidatePath } from "next/cache";

import { inventoryMovementSchema } from "@/lib/commerce";
import { createInventoryMovement, listInventoryMovements } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ movements: listInventoryMovements() });
}

export async function POST(request: Request) {
  try {
    const movement = createInventoryMovement(inventoryMovementSchema.parse(await request.json()));
    revalidatePath("/");
    revalidatePath("/catalog");
    return Response.json({ movement }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
