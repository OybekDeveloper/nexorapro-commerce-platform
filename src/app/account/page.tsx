import type { Metadata } from "next";
import { LogOut, UserRound } from "lucide-react";

import { AccountOrders } from "@/components/account/account-orders";
import { LogoutButton } from "@/components/auth/logout-button";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { requirePageUser } from "@/server/auth";
import { listOrdersByUser } from "@/server/commerce-repository";

export const metadata: Metadata = { title: "Akkaunt", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await requirePageUser(undefined, "/login?next=/account");
  const orders = listOrdersByUser(user.id);
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
    <StoreHeader />
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 rounded-[2rem] bg-[#07110f] p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div className="flex items-center gap-4"><span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand"><UserRound className="size-6" /></span><div><p className="text-sm text-[#72dcc8]">Mijoz akkaunti</p><h1 className="mt-1 text-2xl font-semibold">{user.name}</h1><p className="mt-1 text-sm text-zinc-400">{user.email}</p></div></div>
        <LogoutButton redirectTo="/" className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold hover:bg-white/15"><LogOut className="size-4" />Chiqish</LogoutButton>
      </div>
      <AccountOrders initialOrders={orders} />
    </main>
    <StoreFooter />
  </div>;
}
