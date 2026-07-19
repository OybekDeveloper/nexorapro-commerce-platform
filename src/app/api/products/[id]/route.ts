import { updateProductSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { archiveProduct, getProduct, updateProduct } from "@/server/commerce-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const product = getProduct(id);
    if (!product) return Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    if (product.status !== "published" || !product.visibleOnStorefront) await requireApiUser("admin");
    return Response.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const { id } = await context.params;
    const previous = getProduct(id);
    const product = updateProduct(id, updateProductSchema.parse(await request.json()));
    if (!product) return Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    invalidateProducts([previous?.slug, product.slug].filter((slug): slug is string => Boolean(slug)));
    return Response.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const { id } = await context.params;
    const product = archiveProduct(id);
    if (!product) return Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    invalidateProducts([product.slug]);
    return Response.json({ product });
  } catch (error) {
    return apiError(error);
  }
}
