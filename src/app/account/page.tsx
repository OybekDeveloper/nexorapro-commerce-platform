import type { Metadata } from "next";
import { LogOut, PackageCheck, UserRound } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { formatStoreMoney } from "@/lib/storefront-data";
import { requirePageUser } from "@/server/auth";
import { listOrdersByUser } from "@/server/commerce-repository";

export const metadata: Metadata = { title: "Akkaunt", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await requirePageUser(undefined, "/login?next=/account");
  const orders = listOrdersByUser(user.id);
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><StoreHeader /><main id="main-content" className="mx-auto min-h-[70vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 rounded-[2rem] bg-[#07110f] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9"><div className="flex items-center gap-4"><span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand"><UserRound className="size-6" /></span><div><p className="text-sm text-[#72dcc8]">Mijoz akkaunti</p><h1 className="mt-1 text-2xl font-semibold">{user.name}</h1><p className="mt-1 text-sm text-zinc-400">{user.email}</p></div></div><LogoutButton redirectTo="/" className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/15"><LogOut className="size-4" />Chiqish</LogoutButton></div><section className="mt-8"><div><p className="text-sm font-semibold text-brand">Buyurtmalar tarixi</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Sizning xaridlaringiz.</h2></div>{orders.length === 0 ? <div className="mt-6 rounded-[1.75rem] bg-white p-9 text-center"><PackageCheck className="mx-auto size-8 text-brand" /><p className="mt-4 font-semibold">Hali buyurtma yo‘q</p><p className="mt-1 text-sm text-zinc-500">Checkout yakunlangach buyurtma shu yerda ko‘rinadi.</p></div> : <div className="mt-6 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-[1.5rem] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{order.id}</p><p className="mt-1 text-xs text-zinc-500">{new Intl.DateTimeFormat("uz-UZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div><span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{order.status}</span></div><div className="mt-4 border-t border-black/5 pt-4 text-sm text-zinc-600">{order.items.map((item) => <p key={item.productId}>{item.productName} × {item.quantity}</p>)}</div><p className="mt-4 text-right text-lg font-semibold">{formatStoreMoney(order.total)}</p></article>)}</div>}</section></main><StoreFooter /></div>;
}
