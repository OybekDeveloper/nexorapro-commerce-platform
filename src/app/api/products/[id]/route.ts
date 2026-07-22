import { toStorefrontProduct, updateProductSchema } from "@/lib/commerce";
import { getOptionalUser, requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { deleteProduct, getProduct, updateProduct } from "@/server/commerce-repository";
import { apiError, assertSameOrigin, getRequestId, HttpError, parseJsonBody } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const product = getProduct(id);
    if (!product) throw new HttpError(404, "Mahsulot topilmadi");
    const user = await getOptionalUser();
    if (user?.role === "admin") return Response.json({ product }, { headers: { "Cache-Control": "private, no-store" } });
    if (product.status !== "published" || !product.visibleOnStorefront) await requireApiUser("admin");
    return Response.json({ product: toStorefrontProduct(product) });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const { id } = await context.params;
    const previous = getProduct(id);
    const product = updateProduct(id, await parseJsonBody(request, updateProductSchema), {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    if (!product) throw new HttpError(404, "Mahsulot topilmadi");
    invalidateProducts([previous?.slug, product.slug].filter((slug): slug is string => Boolean(slug)));
    return Response.json({ product });
  } catch (error) {
    return apiError(error, request);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser("admin");
    const { id } = await context.params;
    const product = deleteProduct(id, {
      actorUserId: user.id,
      requestId: getRequestId(request),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    if (!product) throw new HttpError(404, "Mahsulot topilmadi");
    invalidateProducts([product.slug]);
    return Response.json({ product });
  } catch (error) {
    return apiError(error, request);
  }
}
