"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Clock3, PackageCheck, Search, Truck, XCircle } from "lucide-react";

import { apiRequest } from "@/lib/api-client";
import type { CommerceOrder } from "@/lib/commerce";
import { cn } from "@/lib/utils";

type OrderStatus = "new" | "paid" | "packing" | "shipping" | "completed" | "cancelled";
type Order = { id: string; customer: string; phone: string; items: string; total: string; channel: string; payment: string; status: OrderStatus; time: string };

const statusMeta: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: "Yangi", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  paid: { label: "To‘landi", className: "bg-brand/10 text-brand" },
  packing: { label: "Tayyorlanmoqda", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  shipping: { label: "Yetkazilmoqda", className: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  completed: { label: "Yakunlandi", className: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300" },
  cancelled: { label: "Bekor qilindi", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
};

const seedOrders: Order[] = [
  { id: "#NX-1062", customer: "Sardor Karimov", phone: "+998 90 123 45 67", items: "iPhone 17 Pro · 1 dona", total: "20 999 000", channel: "Online", payment: "Karta", status: "new", time: "10:42" },
  { id: "#NX-1061", customer: "Madina Islomova", phone: "+998 93 612 08 21", items: "AirPods Pro 3 · 2 dona", total: "6 998 000", channel: "Online", payment: "Click", status: "paid", time: "10:18" },
  { id: "#NX-1060", customer: "Azizbek Tursunov", phone: "+998 99 440 18 12", items: "MacBook Air 13 M5 · 1 dona", total: "17 999 000", channel: "POS", payment: "Karta", status: "packing", time: "09:54" },
  { id: "#NX-1059", customer: "Kamola Rahimova", phone: "+998 97 221 77 03", items: "iPad Air 11 M4 · 1 dona", total: "10 999 000", channel: "Online", payment: "Payme", status: "shipping", time: "09:31" },
  { id: "#NX-1058", customer: "Bekzod Aliyev", phone: "+998 91 663 20 40", items: "iPhone 17 Pro Max · 1 dona", total: "26 499 000", channel: "POS", payment: "Naqd", status: "completed", time: "Kecha" },
  { id: "#NX-1057", customer: "Nilufar Sodiqova", phone: "+998 95 455 71 90", items: "MacBook Air 15 M5 · 1 dona", total: "21 499 000", channel: "Online", payment: "Karta", status: "cancelled", time: "Kecha" },
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = { new: "paid", paid: "packing", packing: "shipping", shipping: "completed" };
const paymentLabels: Record<string, string> = { cash: "Naqd", card: "Karta", installment: "Bo‘lib to‘lash", click: "Click", payme: "Payme" };
const formatMoney = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function toDisplayOrder(order: CommerceOrder): Order {
  return {
    id: order.id,
    customer: order.customer,
    phone: order.phone,
    items: order.items.map((item) => `${item.productName} · ${item.quantity} dona`).join(", "),
    total: formatMoney(order.total),
    channel: order.channel,
    payment: paymentLabels[order.payment] ?? order.payment,
    status: order.status,
    time: new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(`${order.createdAt}Z`)),
  };
}

export function OrdersWorkspace() {
  const [orders, setOrders] = useState(seedOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(() => orders.filter((order) => (status === "all" || order.status === status) && `${order.id} ${order.customer} ${order.phone} ${order.items}`.toLowerCase().includes(query.toLowerCase())), [orders, query, status]);

  useEffect(() => {
    apiRequest<{ orders: CommerceOrder[] }>("/api/orders")
      .then((payload) => setOrders(payload.orders.map(toDisplayOrder)))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Buyurtmalar yuklanmadi"))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, next: OrderStatus) => {
    setError(null);
    try {
      const payload = await apiRequest<{ order: CommerceOrder }>(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      const updated = toDisplayOrder(payload.order);
      setOrders((current) => current.map((order) => order.id === id ? updated : order));
      setSelected((current) => current?.id === id ? updated : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status yangilanmadi");
    }
  };

  const metrics = [
    { label: "Yangi", value: orders.filter((order) => order.status === "new").length, icon: Clock3, className: "text-blue-600 bg-blue-500/10" },
    { label: "Tayyorlanmoqda", value: orders.filter((order) => ["paid", "packing"].includes(order.status)).length, icon: PackageCheck, className: "text-amber-600 bg-amber-500/10" },
    { label: "Yetkazilmoqda", value: orders.filter((order) => order.status === "shipping").length, icon: Truck, className: "text-violet-600 bg-violet-500/10" },
    { label: "Yakunlangan", value: orders.filter((order) => order.status === "completed").length, icon: CheckCircle2, className: "text-brand bg-brand/10" },
  ];

  return <div className="space-y-5">{error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700">{error}</div>}<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, className }) => <article key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><span className={cn("inline-flex size-10 items-center justify-center rounded-xl", className)}><Icon className="size-[18px]" /></span><strong className="text-2xl">{value}</strong></div><p className="mt-4 text-sm text-muted-foreground">{label}</p></article>)}</section><section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><label htmlFor="order-search" className="sr-only">Buyurtma qidirish</label><input id="order-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, mijoz yoki telefon..." className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><div className="relative"><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background pl-3 pr-9 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"><option value="all">Barcha statuslar</option>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div></div><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Buyurtma</th><th className="px-4 py-3 font-medium">Mijoz</th><th className="px-4 py-3 font-medium">Tarkib</th><th className="px-4 py-3 font-medium">To‘lov</th><th className="px-4 py-3 font-medium">Summa</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Amal</th></tr></thead><tbody className="divide-y divide-border">{filtered.map((order) => <tr key={order.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setSelected(order)}><td className="px-5 py-4"><p className="font-semibold">{order.id}</p><p className="mt-1 text-xs text-muted-foreground">{order.channel} · {order.time}</p></td><td className="px-4 py-4"><p className="font-medium">{order.customer}</p><p className="mt-1 text-xs text-muted-foreground">{order.phone}</p></td><td className="px-4 py-4 text-muted-foreground">{order.items}</td><td className="px-4 py-4"><p>{order.payment}</p></td><td className="px-4 py-4 whitespace-nowrap font-semibold">{order.total} so‘m</td><td className="px-4 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusMeta[order.status].className)}>{statusMeta[order.status].label}</span></td><td className="px-4 py-4">{nextStatus[order.status] ? <button type="button" onClick={(event) => { event.stopPropagation(); void updateStatus(order.id, nextStatus[order.status]!); }} className="h-8 cursor-pointer rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:opacity-85">Keyingi status</button> : <span className="text-xs text-muted-foreground">Yakunlangan</span>}</td></tr>)}</tbody></table></div><div className="divide-y divide-border lg:hidden">{filtered.map((order) => <button key={order.id} type="button" onClick={() => setSelected(order)} className="w-full cursor-pointer p-4 text-left hover:bg-muted/40"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{order.id} · {order.customer}</p><p className="mt-1 text-xs text-muted-foreground">{order.items}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-semibold", statusMeta[order.status].className)}>{statusMeta[order.status].label}</span></div><div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">{order.channel} · {order.payment}</span><strong>{order.total} so‘m</strong></div></button>)}</div>{filtered.length === 0 && <div className="px-5 py-16 text-center"><XCircle className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">{loading ? "Buyurtmalar yuklanmoqda..." : "Buyurtma topilmadi"}</p></div>}<div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">{filtered.length} ta buyurtma · persistent API ma’lumoti</div></section>{selected && <div className="fixed inset-0 z-[70]"><button type="button" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Buyurtma panelini yopish" /><aside className="absolute inset-y-0 right-0 w-[min(92vw,430px)] overflow-y-auto bg-background p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-brand">Buyurtma tafsiloti</p><h2 className="mt-1 text-xl font-semibold">{selected.id}</h2></div><button type="button" onClick={() => setSelected(null)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl bg-muted" aria-label="Yopish"><XCircle className="size-5" /></button></div><div className="mt-6 space-y-3 rounded-2xl border border-border p-4 text-sm"><div><p className="text-xs text-muted-foreground">Mijoz</p><p className="mt-1 font-semibold">{selected.customer}</p><p className="mt-1 text-muted-foreground">{selected.phone}</p></div><div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Mahsulotlar</p><p className="mt-1 font-medium">{selected.items}</p></div><div className="border-t border-border pt-3"><p className="text-xs text-muted-foreground">Jami</p><p className="mt-1 text-lg font-semibold">{selected.total} so‘m</p></div></div><label className="mt-5 block space-y-2"><span className="text-sm font-semibold">Statusni boshqarish</span><select value={selected.status} onChange={(event) => void updateStatus(selected.id, event.target.value as OrderStatus)} className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label><div className="mt-5 rounded-2xl bg-muted p-4"><p className="text-sm font-semibold">Buyurtma timeline</p><div className="mt-3 space-y-3 text-xs text-muted-foreground"><p>• Buyurtma {selected.time} da qabul qilindi</p><p>• To‘lov usuli: {selected.payment}</p><p>• Kanal: {selected.channel}</p></div></div></aside></div>}</div>;
}
