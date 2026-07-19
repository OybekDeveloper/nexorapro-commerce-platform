import { revalidatePath } from "next/cache";

import { createOrderSchema } from "@/lib/commerce";
import { createOrder, listOrders } from "@/server/commerce-repository";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ orders: listOrders() });
}

export async function POST(request: Request) {
  try {
    const order = createOrder(createOrderSchema.parse(await request.json()));
    revalidatePath("/");
    revalidatePath("/catalog");
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
