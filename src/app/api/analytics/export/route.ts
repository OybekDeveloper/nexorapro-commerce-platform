import { listOrders } from "@/server/commerce-repository";

export const dynamic = "force-dynamic";

const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function GET() {
  const rows = listOrders().map((order) => [order.id, order.createdAt, order.customer, order.channel, order.payment, order.status, order.subtotal, order.discount, order.total].map(quote).join(","));
  const csv = ["order_id,created_at,customer,channel,payment,status,subtotal,discount,total", ...rows].join("\n");
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=nexorapro-orders.csv",
    },
  });
}
