"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, PackageCheck, RefreshCw, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

import { apiRequest } from "@/lib/api-client";
import type { SalesReport } from "@/lib/commerce";

const formatMoney = (value: number) => Math.round(value).toLocaleString("uz-UZ");
const today = new Date();
const initialTo = today.toISOString().slice(0, 10);
const initialFrom = new Date(today.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);

export function AnalyticsWorkspace() {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const query = useMemo(() => new URLSearchParams({ from, to, limit: "10" }).toString(), [from, to]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest<{ report: SalesReport }>(`/api/reports/sales?${query}`);
      setReport(payload.report);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Hisobot yuklanmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    apiRequest<{ report: SalesReport }>(`/api/reports/sales?${query}`)
      .then((payload) => { if (active) setReport(payload.report); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Hisobot yuklanmadi"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);

  const maximumDailyRevenue = Math.max(1, ...(report?.daily.map((item) => item.revenue) ?? [1]));
  const maximumProductRevenue = Math.max(1, ...(report?.topProducts.map((item) => item.revenue) ?? [1]));
  const summary = report?.summary;
  const metrics = [
    { label: "Tushum", value: `${formatMoney(summary?.revenue ?? 0)} UZS`, note: `${summary?.orderCount ?? 0} ta yakunlanmagan/cancel qilinmagan buyurtma`, icon: Wallet },
    { label: "Gross foyda", value: `${formatMoney(summary?.grossProfit ?? 0)} UZS`, note: "Sotuv va snapshot kirim narxi farqi", icon: TrendingUp },
    { label: "O‘rtacha chek", value: `${formatMoney(summary?.averageOrderValue ?? 0)} UZS`, note: `${formatMoney(summary?.discountTotal ?? 0)} UZS chegirma`, icon: ShoppingCart },
    { label: "Sotilgan birlik", value: `${summary?.unitsSold ?? 0} dona`, note: `${summary?.cancelledOrders ?? 0} ta bekor qilingan`, icon: PackageCheck },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3"><label className="space-y-1"><span className="block text-xs font-medium text-muted-foreground">Boshlanish</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm" /></label><label className="space-y-1"><span className="block text-xs font-medium text-muted-foreground">Tugash</span><input type="date" value={to} min={from} max={initialTo} onChange={(event) => setTo(event.target.value)} className="h-10 rounded-xl border border-input bg-background px-3 text-sm" /></label></div>
        <div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Yangilash</button><Link href={`/api/reports/export?report=sales&${query}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white"><Download className="size-4" />CSV</Link></div>
      </section>
      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon className="size-[18px]" /></span><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 break-words text-xl font-semibold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></article>)}</section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.7fr)]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div><h2 className="font-semibold">Kunlik tushum</h2><p className="mt-1 text-sm text-muted-foreground">DB’dagi real buyurtmalar bo‘yicha</p></div><div className="mt-6 flex h-64 items-end gap-1 overflow-x-auto border-b border-border pb-1">{report?.daily.length ? report.daily.map((day) => <div key={day.date} className="group flex min-w-7 flex-1 flex-col items-center justify-end gap-2" title={`${day.date}: ${formatMoney(day.revenue)} UZS`}><span className="hidden text-[9px] text-muted-foreground group-hover:block">{day.orderCount}</span><div className="w-full max-w-10 rounded-t bg-brand transition-opacity hover:opacity-75" style={{ height: `${Math.max(3, Math.round((day.revenue / maximumDailyRevenue) * 210))}px` }} /><span className="-rotate-45 whitespace-nowrap text-[9px] text-muted-foreground">{day.date.slice(5)}</span></div>) : <div className="m-auto text-sm text-muted-foreground">Tanlangan davrda sotuv yo‘q</div>}</div></article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><h2 className="font-semibold">Kanallar va to‘lov</h2><p className="mt-1 text-sm text-muted-foreground">Buyurtmalar taqsimoti</p><div className="mt-5 space-y-3">{report?.channels.map((item) => <div key={item.name} className="rounded-xl bg-muted/60 p-3"><div className="flex justify-between text-sm"><span className="font-medium">{item.name}</span><strong>{item.orderCount} ta</strong></div><p className="mt-1 text-xs text-muted-foreground">{formatMoney(item.revenue)} UZS</p></div>)}</div><div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To‘lov usullari</p><div className="mt-2 flex flex-wrap gap-2">{report?.payments.map((item) => <span key={item.name} className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{item.name} · {item.orderCount}</span>)}</div></div></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><BarChart3 className="size-5 text-brand" /><div><h2 className="font-semibold">Top mahsulotlar</h2><p className="mt-1 text-sm text-muted-foreground">Tushum bo‘yicha</p></div></div><div className="mt-5 space-y-4">{report?.topProducts.map((product, index) => <div key={product.productId}><div className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold">{index + 1}. {product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.quantity} dona · {formatMoney(product.revenue)} UZS</p></div><span className="shrink-0 text-xs font-semibold text-brand">+{formatMoney(product.grossProfit)} UZS</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.round((product.revenue / maximumProductRevenue) * 100)}%` }} /></div></div>)}</div></article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><h2 className="font-semibold">Kategoriya va statuslar</h2><p className="mt-1 text-sm text-muted-foreground">Sotuv tarkibi va buyurtma holati</p><div className="mt-5 space-y-3">{report?.categories.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-sm"><span className="font-medium">{item.name}</span><span className="text-right"><strong>{formatMoney(item.revenue)} UZS</strong><span className="ml-2 text-xs text-muted-foreground">{item.quantity} dona</span></span></div>)}</div><div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{report?.statuses.map((item) => <span key={item.name} className="rounded-full border border-border px-2.5 py-1 text-xs"><strong>{item.name}</strong> · {item.orderCount}</span>)}</div></article>
      </section>
    </div>
  );
}
