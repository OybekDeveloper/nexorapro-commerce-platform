"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingBag, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import { formatStoreMoney, type StoreProduct } from "@/lib/storefront-data";
import { animateAddButton } from "@/lib/storefront-motion";
import { cn } from "@/lib/utils";

const copy = {
  UZ: { price: "Narxi", added: "Qo‘shildi", add: "savatga qo‘shish", select: "variantni tanlash" },
  RU: { price: "Цена", added: "Добавлено", add: "добавить в корзину", select: "выбрать вариант" },
  EN: { price: "Price", added: "Added", add: "add to cart", select: "select a variant" },
} satisfies Record<StoreLocale, Record<string, string>>;

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const { addToCart, locale, products } = useStore();
  const localizedProduct = products.find((item) => item.id === product.id) ?? product;
  const labels = copy[locale];
  const hasVariants = (localizedProduct.variants?.filter((variant) => variant.status === "active").length ?? 0) > 0;
  const [added, setAdded] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasVariants) return;
    addToCart(localizedProduct.id);
    setAdded(true);
    void animateAddButton(event.currentTarget);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setAdded(false), 1_600);
  };

  return (
    <article data-motion-card className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-black/[0.05] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-brand/25 hover:shadow-[0_18px_55px_rgba(16,161,132,0.1)] sm:p-5">
      <Link prefetch={false} href={`/product/${localizedProduct.slug}`} data-shared-product={localizedProduct.slug} data-shared-product-frame className="relative aspect-[1.55/1] cursor-pointer overflow-hidden rounded-3xl bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <Image
          src={localizedProduct.image}
          alt={localizedProduct.imageAlt}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, (max-width: 1280px) 45vw, 31vw"
          quality={72}
          className="object-cover transition-transform duration-300 motion-safe:sm:group-hover:scale-[1.018]"
        />
        {localizedProduct.badge && <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-semibold text-zinc-800 shadow-sm backdrop-blur-md">{localizedProduct.badge}</span>}
      </Link>
      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold uppercase tracking-[0.15em] text-zinc-500">{localizedProduct.category}</span>
          <span className="inline-flex items-center gap-1 font-medium text-zinc-500"><Star className="size-3.5 fill-brand text-brand" />{localizedProduct.rating} ({localizedProduct.reviews})</span>
        </div>
        <Link prefetch={false} href={`/product/${localizedProduct.slug}`} className="mt-2 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <h3 className="text-xl font-semibold tracking-[-0.025em] text-[#1d1d1f]">{localizedProduct.name}</h3>
        </Link>
        <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-600">{localizedProduct.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{localizedProduct.specs.slice(0, 3).map((spec) => <span key={spec} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">{spec}</span>)}</div>
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-black/5 pt-5">
          <div><p className="text-xs text-zinc-500">{labels.price}</p><p className="mt-1 font-semibold text-brand">{formatStoreMoney(localizedProduct.price)}</p>{localizedProduct.compareAtPrice && <p className="mt-0.5 text-xs text-zinc-500 line-through">{formatStoreMoney(localizedProduct.compareAtPrice)}</p>}</div>
          {hasVariants ? <Link prefetch={false} href={`/product/${localizedProduct.slug}`} className="inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-brand px-3 text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" aria-label={`${localizedProduct.name}: ${labels.select}`}><ShoppingBag className="size-4" /></Link> : <button type="button" onClick={handleAdd} className={cn("inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-3 text-sm font-semibold text-white transition-[opacity,background-color,min-width] hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2", added && "min-w-[112px] bg-[#0c806a]")} aria-label={`${localizedProduct.name}: ${labels.add}`} aria-live="polite">
            {added ? <><Check className="size-4" /><span>{labels.added}</span></> : <ShoppingBag className="size-4" />}
          </button>}
        </div>
      </div>
    </article>
  );
}
