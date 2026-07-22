import { z } from "zod";

import { requireApiUser } from "@/server/auth";
import { invalidateInventory } from "@/server/cache-invalidation";
import { updateInventoryReservationStatus } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, HttpError, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({ status: z.enum(["released", "committed"]) }).strict();

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const { id } = await context.params;
    const input = await parseJsonBody(request, updateSchema, 16_384);
    const reservation = updateInventoryReservationStatus(id, input.status, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    if (!reservation) throw new HttpError(404, "Rezerv topilmadi");
    invalidateInventory();
    return Response.json({ reservation });
  } catch (error) {
    return apiError(error, request);
  }
}
