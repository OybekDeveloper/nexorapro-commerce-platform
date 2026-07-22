import { z } from "zod";

import { requireApiUser } from "@/server/auth";
import { listProducts } from "@/server/commerce-repository";
import { toCsv } from "@/server/csv";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
  includeDeleted: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
}).strict();

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const products = listProducts({ includeDeleted: query.includeDeleted });
    if (query.format === "json") {
      return Response.json({ products, exportedAt: new Date().toISOString() }, {
        headers: { "Content-Disposition": "attachment; filename=nexorapro-products.json" },
      });
    }
    const headers = [
      "name", "sku", "category", "cost_price", "price", "compare_at_price", "stock",
      "status", "visible", "image", "description", "languages", "variants_json", "media_json",
    ];
    const rows = products.map((product) => [
      product.name,
      product.sku,
      product.category,
      product.costPrice,
      product.price,
      product.compareAtPrice ?? "",
      product.stock,
      product.status,
      product.visibleOnStorefront,
      product.image,
      product.description,
      product.languages.join("|"),
      JSON.stringify(product.variants),
      JSON.stringify(product.media),
    ]);
    return new Response(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=nexorapro-products.csv",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error, request);
  }
}
