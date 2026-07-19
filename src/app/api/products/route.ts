import { revalidatePath } from "next/cache";

import { createProductSchema } from "@/lib/commerce";
import { createProduct, listProducts } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return Response.json({ products: listProducts({ storefrontOnly: searchParams.get("scope") === "storefront" }) });
}

export async function POST(request: Request) {
  try {
    const product = createProduct(createProductSchema.parse(await request.json()));
    revalidatePath("/");
    revalidatePath("/catalog");
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
