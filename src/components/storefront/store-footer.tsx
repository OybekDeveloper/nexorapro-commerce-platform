import Link from "next/link";

import { NexoraMark } from "@/components/icons/nexora-icons";

export function StoreFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#f5f5f7] px-4 py-12 text-sm text-zinc-600 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_2fr]">
        <div><Link href="/" className="inline-flex cursor-pointer items-center gap-2 text-lg font-semibold tracking-[-0.04em] text-[#1d1d1f]"><NexoraMark className="size-7 text-brand" />nexorapro<span className="-ml-2 text-brand">.dev</span></Link><p className="mt-4 max-w-sm leading-6">Premium texnologiyalar, shaffof tanlov va boshqariladigan commerce tajribasi.</p></div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3"><div><p className="font-semibold text-[#1d1d1f]">Xarid</p><div className="mt-3 space-y-2"><Link href="/catalog" className="block hover:text-brand">Katalog</Link><Link href="/cart" className="block hover:text-brand">Savat</Link></div></div><div><p className="font-semibold text-[#1d1d1f]">Kategoriyalar</p><div className="mt-3 space-y-2"><Link href="/catalog?category=Smartfon" className="block hover:text-brand">Smartfonlar</Link><Link href="/catalog?category=Noutbuk" className="block hover:text-brand">Noutbuklar</Link><Link href="/catalog?category=Planshet" className="block hover:text-brand">Planshetlar</Link></div></div><div><p className="font-semibold text-[#1d1d1f]">Platforma</p><div className="mt-3 space-y-2"><Link href="/admin" className="block hover:text-brand">Admin preview</Link><span className="block">UZ · RU · EN</span></div></div></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-black/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"><p>© 2026 nexorapro.dev Commerce. Portfolio demo.</p><p>Product imagery © Apple Inc. · Mock pricing and inventory</p></div>
    </footer>
  );
}
