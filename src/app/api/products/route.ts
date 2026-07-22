import { createProductSchema, productListQuerySchema, toStorefrontProduct } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { createProduct, listProducts, listProductsPage } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const storefrontOnly = new URL(request.url).searchParams.get("scope") === "storefront";
    if (storefrontOnly) return Response.json({ products: listProducts({ storefrontOnly: true }).map(toStorefrontProduct) });
    await requireApiUser("admin");
    const params = new URL(request.url).searchParams;
    params.delete("scope");
    const query = productListQuerySchema.parse(Object.fromEntries(params));
    return Response.json(listProductsPage(query), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const product = createProduct(await parseJsonBody(request, createProductSchema), {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    invalidateProducts([product.slug]);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
