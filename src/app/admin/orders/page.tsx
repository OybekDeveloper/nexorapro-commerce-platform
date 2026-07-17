import { OrdersWorkspace } from "@/components/admin/orders-workspace";

export default function OrdersPage() {
  return <div className="mx-auto max-w-[1600px] space-y-6"><div><p className="text-sm font-medium text-brand">Order management</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Buyurtmalar</h1><p className="mt-1 text-sm text-muted-foreground">Online va POS buyurtmalarini status, to‘lov va yetkazib berish bo‘yicha boshqaring.</p></div><OrdersWorkspace /></div>;
}
