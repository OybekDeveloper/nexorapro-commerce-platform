import { bulkProductSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { bulkMutateProducts } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const input = await parseJsonBody(request, bulkProductSchema, 65_536);
    const products = bulkMutateProducts(input, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateProducts(products.map((product) => product.slug));
    return Response.json({ products, affected: products.length });
  } catch (error) {
    return apiError(error, request);
  }
}
