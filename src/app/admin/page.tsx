import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { CategoryChart, RevenueChart } from "@/components/admin/sales-chart";
import { NexoraIcon, type NexoraIconName } from "@/components/icons/nexora-icons";
import { getAnalytics, listProducts } from "@/server/commerce-repository";

const formatMoney = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const statusLabels = { new: "Yangi", paid: "To‘landi", packing: "Tayyorlanmoqda", shipping: "Yetkazilmoqda", completed: "Yakunlandi", cancelled: "Bekor qilindi" };

export default function AdminDashboardPage() {
  const products = listProducts();
  const analytics = getAnalytics();
  const lowStock = products.filter((product) => product.stock <= 5);
  const averageOrder = analytics.orderCount ? analytics.revenue / analytics.orderCount : 0;
  const stats: Array<{ label: string; value: string; suffix: string; trend: string; positive: boolean; icon: NexoraIconName }> = [
    { label: "Umumiy tushum", value: `${(analytics.revenue / 1_000_000).toFixed(1)} mln`, suffix: "so‘m", trend: "Live", positive: true, icon: "revenue" },
    { label: "Buyurtmalar", value: formatMoney(analytics.orderCount), suffix: "ta", trend: "Live", positive: true, icon: "order" },
    { label: "O‘rtacha chek", value: formatMoney(averageOrder), suffix: "so‘m", trend: "Live", positive: true, icon: "average" },
    { label: "Sotilgan", value: formatMoney(analytics.unitsSold), suffix: "dona", trend: "DB", positive: true, icon: "return" },
  ];
  const recentOrders = analytics.recentOrders.slice(0, 4).map((order) => ({
    id: order.id,
    customer: order.customer,
    product: order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", "),
    total: formatMoney(order.total),
    status: statusLabels[order.status],
  }));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">{new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Xayrli kun, Oybek Aka</h1>
          <p className="mt-1 text-sm text-muted-foreground">Do‘koningizning bugungi holati va asosiy ko‘rsatkichlari.</p>
        </div>
        <Link href="/admin/products" className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,161,132,0.18)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Mahsulot qo‘shish <ArrowRight className="size-4" />
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Asosiy ko‘rsatkichlar">
        {stats.map((stat) => {
          return (
            <article key={stat.label} className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
              <div className="flex items-start justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><NexoraIcon name={stat.icon} className="size-[19px]" /></span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold ${stat.positive ? "bg-brand/10 text-brand" : "bg-red-500/10 text-red-600"}`}>
                  {stat.trend.startsWith("-") ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}{stat.trend}
                </span>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{stat.value} <span className="text-sm font-medium text-muted-foreground">{stat.suffix}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">persistent database hisoboti</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div><h2 className="font-semibold">Sotuv dinamikasi</h2><p className="mt-1 text-sm text-muted-foreground">Oxirgi 30 kun, mln so‘m</p></div>
            <select aria-label="Grafik davri" className="h-9 cursor-pointer rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option>30 kun</option><option>7 kun</option><option>90 kun</option></select>
          </div>
          <RevenueChart />
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold">Kategoriya ulushi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sotuvlar bo‘yicha taqqoslash</p>
          <CategoryChart />
          <div className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Smartfonlar jami sotuvning <strong className="text-foreground">48%</strong>ini tashkil qildi.</div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5 sm:px-6">
            <div><h2 className="font-semibold">So‘nggi buyurtmalar</h2><p className="mt-1 text-sm text-muted-foreground">Bugun qabul qilingan buyurtmalar</p></div>
            <Link href="/admin/orders" className="cursor-pointer text-sm font-semibold text-brand hover:opacity-75">Barchasi</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-3 font-medium">Buyurtma</th><th className="px-4 py-3 font-medium">Mijoz</th><th className="px-4 py-3 font-medium">Mahsulot</th><th className="px-4 py-3 font-medium">Summa</th><th className="px-4 py-3 font-medium">Holat</th></tr></thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => <tr key={order.id} className="transition-colors hover:bg-muted/40"><td className="px-6 py-4 font-semibold">{order.id}</td><td className="px-4 py-4">{order.customer}</td><td className="px-4 py-4 text-muted-foreground">{order.product}</td><td className="px-4 py-4 font-medium">{order.total} so‘m</td><td className="px-4 py-4"><span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{order.status}</span></td></tr>)}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-amber-500/25 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><AlertTriangle className="size-[18px]" /></span><span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">{lowStock.length} ta ogohlantirish</span></div>
          <h2 className="mt-5 font-semibold">Kam qolgan mahsulotlar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Kirim rejasiga qo‘shish tavsiya etiladi.</p>
          <div className="mt-4 space-y-2">
            {lowStock.map((product) => <div key={product.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-3"><div><p className="text-sm font-medium">{product.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p></div><span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{product.stock} dona</span></div>)}
          </div>
          <Link href="/admin/inventory" className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-brand hover:opacity-75">Omborni ochish <ArrowRight className="size-4" /></Link>
        </article>
      </section>
    </div>
  );
}
