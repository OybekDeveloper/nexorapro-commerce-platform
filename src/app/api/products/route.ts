import { createProductSchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { invalidateProducts } from "@/server/cache-invalidation";
import { createProduct, listProducts } from "@/server/commerce-repository";
import { apiError, assertSameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const storefrontOnly = new URL(request.url).searchParams.get("scope") === "storefront";
    if (!storefrontOnly) await requireApiUser("admin");
    return Response.json({ products: listProducts({ storefrontOnly }) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireApiUser("admin");
    const product = createProduct(createProductSchema.parse(await request.json()));
    invalidateProducts([product.slug]);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
