import { revalidatePath } from "next/cache";

import { updateProductSchema } from "@/lib/commerce";
import { archiveProduct, getProduct, updateProduct } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const product = getProduct(id);
  return product ? Response.json({ product }) : Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const product = updateProduct(id, updateProductSchema.parse(await request.json()));
    if (!product) return Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath(`/product/${product.slug}`);
    return Response.json({ product });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const product = archiveProduct(id);
  if (!product) return Response.json({ error: "Mahsulot topilmadi" }, { status: 404 });
  revalidatePath("/");
  revalidatePath("/catalog");
  return Response.json({ product });
}
