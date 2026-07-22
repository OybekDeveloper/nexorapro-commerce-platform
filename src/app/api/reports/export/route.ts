import { z } from "zod";

import { reportRangeQuerySchema } from "@/lib/commerce";
import { requireApiUser } from "@/server/auth";
import { getInventoryReport, getSalesReport } from "@/server/commerce-repository";
import { toCsv } from "@/server/csv";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

const exportQuerySchema = reportRangeQuerySchema.safeExtend({
  report: z.enum(["sales", "inventory"]).default("sales"),
});

export async function GET(request: Request) {
  try {
    await requireApiUser("admin");
    const query = exportQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (query.report === "inventory") {
      const report = getInventoryReport();
      const rows = report.lowStock.map((item) => [item.productId, item.productName, item.sku, item.variantId ?? "", item.variantTitle ?? "", item.stock, item.reserved, item.available]);
      return new Response(toCsv(["product_id", "product_name", "sku", "variant_id", "variant_title", "stock", "reserved", "available"], rows), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=nexorapro-inventory-report.csv", "Cache-Control": "private, no-store" },
      });
    }
    const report = getSalesReport(query);
    const rows = report.daily.map((item) => [item.date, item.revenue, item.grossProfit, item.orderCount, item.unitsSold]);
    return new Response(toCsv(["date", "revenue", "gross_profit", "order_count", "units_sold"], rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=nexorapro-sales-report.csv", "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error, request);
  }
}
