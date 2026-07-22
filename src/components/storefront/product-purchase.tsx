"use client";

import { Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import { formatStoreMoney, type StoreProduct } from "@/lib/storefront-data";
import { animateAddButton } from "@/lib/storefront-motion";
import { cn } from "@/lib/utils";

const copy = {
  UZ: { price: "Narxi", color: "Rang", quantity: "Miqdor", available: "dona mavjud", stock: "Ombor holati", added: "Savatga qo‘shildi", add: "Savatga qo‘shish", delivery: "Bepul yetkazib berish", deliveryText: "Toshkent bo‘ylab 24 soat ichida. Demo shartlari amal qiladi." },
  RU: { price: "Цена", color: "Цвет", quantity: "Количество", available: "шт. в наличии", stock: "На складе", added: "Добавлено в корзину", add: "Добавить в корзину", delivery: "Бесплатная доставка", deliveryText: "По Ташкенту в течение 24 часов. Действуют демонстрационные условия." },
  EN: { price: "Price", color: "Color", quantity: "Quantity", available: "in stock", stock: "Stock status", added: "Added to cart", add: "Add to cart", delivery: "Free delivery", deliveryText: "Across Tashkent within 24 hours. Demo terms apply." },
} satisfies Record<StoreLocale, Record<string, string>>;

export function ProductPurchase({ product }: { product: StoreProduct }) {
  const { addToCart, locale } = useStore();
  const labels = copy[locale];
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.colors[0]);
  const [added, setAdded] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
  }, []);

  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    addToCart(product.id, quantity);
    setAdded(true);
    void animateAddButton(event.currentTarget);
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => setAdded(false), 1_700);
  };

  return <div data-motion-reveal className="rounded-[1.75rem] bg-white p-5 shadow-[0_16px_55px_rgba(0,0,0,0.06)] sm:p-7"><p className="text-sm text-zinc-500">{labels.price}</p><div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1"><p className="text-3xl font-semibold tracking-[-0.04em]">{formatStoreMoney(product.price)}</p>{product.compareAtPrice && <p className="pb-1 text-sm text-zinc-500 line-through">{formatStoreMoney(product.compareAtPrice)}</p>}</div><div className="mt-7"><p className="text-sm font-semibold">{labels.color}: <span className="font-normal text-zinc-600">{color}</span></p><div className="mt-3 flex flex-wrap gap-2">{product.colors.map((item) => <button key={item} type="button" onClick={() => setColor(item)} className={cn("h-10 cursor-pointer rounded-full border px-4 text-xs font-semibold transition-colors", color === item ? "border-brand bg-brand/10 text-brand" : "border-black/10 hover:bg-zinc-100")}>{item}</button>)}</div></div><div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold">{labels.quantity}</p><div className="mt-2 inline-flex items-center rounded-full border border-black/10"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-l-full hover:bg-zinc-100"><Minus className="size-4" /></button><span className="w-10 text-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-r-full hover:bg-zinc-100"><Plus className="size-4" /></button></div></div><p className="text-right text-xs text-zinc-500"><strong className="block text-sm text-brand">{product.stock} {labels.available}</strong>{labels.stock}</p></div><button type="button" onClick={handleAdd} className={cn("mt-7 inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,161,132,0.22)] transition-[opacity,background-color] hover:opacity-85", added && "bg-[#0c806a]")} aria-live="polite">{added ? <><Check className="size-4" />{labels.added}</> : <><ShoppingBag className="size-4" />{labels.add}</>}</button><div className="mt-5 flex items-start gap-3 rounded-2xl bg-zinc-100 p-4"><Truck className="mt-0.5 size-5 shrink-0 text-brand" /><div><p className="text-sm font-semibold">{labels.delivery}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{labels.deliveryText}</p></div></div></div>;
}
