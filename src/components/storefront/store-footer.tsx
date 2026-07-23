"use client";

import Link from "next/link";

import { NexoraMark } from "@/components/icons/nexora-icons";
import { useStoreData, type StoreLocale } from "@/components/storefront/store-provider";

const copy = {
  UZ: { intro: "Premium texnologiyalar, shaffof tanlov va boshqariladigan savdo tajribasi.", shop: "Xarid", catalog: "Katalog", cart: "Savat", categories: "Kategoriyalar", phones: "Smartfonlar", laptops: "Noutbuklar", tablets: "Planshetlar", platform: "Platforma", admin: "Admin ko‘rinishi", note: "Mahsulot tasvirlari © Apple Inc. · Narx va qoldiq namuna sifatida" },
  RU: { intro: "Премиальные технологии, прозрачный выбор и управляемая торговая платформа.", shop: "Покупки", catalog: "Каталог", cart: "Корзина", categories: "Категории", phones: "Смартфоны", laptops: "Ноутбуки", tablets: "Планшеты", platform: "Платформа", admin: "Панель администратора", note: "Изображения товаров © Apple Inc. · Демонстрационные цены и остатки" },
  EN: { intro: "Premium technology, transparent choices, and a manageable commerce experience.", shop: "Shop", catalog: "Catalog", cart: "Cart", categories: "Categories", phones: "Smartphones", laptops: "Laptops", tablets: "Tablets", platform: "Platform", admin: "Admin preview", note: "Product imagery © Apple Inc. · Demo pricing and inventory" },
} satisfies Record<StoreLocale, Record<string, string>>;

export function StoreFooter() {
  const { locale } = useStoreData();
  const labels = copy[locale];
  return (
    <footer className="border-t border-black/5 bg-[#f5f5f7] px-4 py-12 text-sm text-zinc-600 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_2fr]">
        <div><Link prefetch={false} href="/" className="inline-flex cursor-pointer items-center gap-2 text-lg font-semibold tracking-[-0.04em] text-[#1d1d1f]"><NexoraMark className="size-7 text-brand" />nexorapro<span className="-ml-2 text-brand">.uz</span></Link><p className="mt-4 max-w-sm leading-6">{labels.intro}</p></div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3"><div><p className="font-semibold text-[#1d1d1f]">{labels.shop}</p><div className="mt-3 space-y-2"><Link prefetch={false} href="/catalog" className="block hover:text-brand">{labels.catalog}</Link><Link prefetch={false} href="/cart" className="block hover:text-brand">{labels.cart}</Link></div></div><div><p className="font-semibold text-[#1d1d1f]">{labels.categories}</p><div className="mt-3 space-y-2"><Link prefetch={false} href="/catalog?category=Smartfon" className="block hover:text-brand">{labels.phones}</Link><Link prefetch={false} href="/catalog?category=Noutbuk" className="block hover:text-brand">{labels.laptops}</Link><Link prefetch={false} href="/catalog?category=Planshet" className="block hover:text-brand">{labels.tablets}</Link></div></div><div><p className="font-semibold text-[#1d1d1f]">{labels.platform}</p><div className="mt-3 space-y-2"><Link prefetch={false} href="/admin" className="block hover:text-brand">{labels.admin}</Link><span className="block">UZ · RU · EN</span></div></div></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-black/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between"><p>© 2026 nexorapro.uz Commerce.</p><p>{labels.note}</p></div>
    </footer>
  );
}
