"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, Search, Trash2, X } from "lucide-react";

import { useProductStore } from "@/components/admin/product-store";
import { NexoraIcon, type NexoraIconName } from "@/components/icons/nexora-icons";
import type { Product, ProductCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type CartLine = { product: Product; quantity: number };
type PaymentMethod = "cash" | "card" | "installment";

const formatMoney = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const categoryArt: Record<ProductCategory, string> = { Smartfon: "SP", Noutbuk: "NB", Audio: "AU", Planshet: "PL", Aksessuar: "AK" };
const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: NexoraIconName }> = [
  { value: "cash", label: "Naqd", icon: "cash" },
  { value: "card", label: "Karta", icon: "card" },
  { value: "installment", label: "Bo‘lib to‘lash", icon: "installment" },
];

export function PointOfSale() {
  const { products, recordSale } = useProductStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Barchasi" | ProductCategory>("Barchasi");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState("");
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sellableProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "Barchasi" || product.category === category;
    return product.status === "published" && product.stock > 0 && matchesQuery && matchesCategory;
  }), [products, query, category]);

  const addToCart = (product: Product) => {
    setCompletedOrder(null);
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (!existing) return [...current, { product, quantity: 1 }];
      return current.map((line) => line.product.id === product.id
        ? { ...line, quantity: Math.min(product.stock, line.quantity + 1) }
        : line);
    });
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId
        ? { ...line, quantity: Math.max(0, Math.min(line.product.stock, line.quantity + change)) }
        : line)
      .filter((line) => line.quantity > 0));
  };

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((sum, line) => sum + line.quantity, 0);

  const finishSale = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    setSaleError(null);
    try {
      const order = await recordSale(
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        { customer, payment: paymentMethod, discount: discountAmount },
      );
      setCompletedOrder(order.id);
      setCart([]);
      setCustomer("");
      setDiscount("");
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : "Sotuvni yakunlab bo‘lmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="pos-search" className="sr-only">Sotuv uchun mahsulot qidirish</label>
            <input id="pos-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mahsulot nomi, SKU yoki barcode..." className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(["Barchasi", "Smartfon", "Noutbuk", "Audio", "Planshet", "Aksessuar"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={cn("h-9 shrink-0 cursor-pointer rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", category === item ? "border-brand bg-brand text-white" : "border-border bg-background hover:bg-muted")}>{item}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {sellableProducts.map((product) => {
            const inCart = cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
            return (
              <button key={product.id} type="button" onClick={() => addToCart(product)} className="group cursor-pointer rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-brand/40 hover:shadow-[0_12px_35px_rgba(16,161,132,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-xs font-bold tracking-wide text-brand">{categoryArt[product.category]}</div>
                  {inCart > 0 && <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{inCart}</span>}
                </div>
                <p className="mt-5 font-semibold">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div><p className="text-xs text-muted-foreground">Sotuv narxi</p><p className="mt-1 text-sm font-semibold">{formatMoney(product.price)} UZS</p></div>
                  <span className="text-xs font-medium text-muted-foreground">{product.stock} dona</span>
                </div>
              </button>
            );
          })}
        </div>

        {sellableProducts.length === 0 && <div className="rounded-2xl border border-dashed border-border px-5 py-16 text-center"><p className="font-medium">Sotuvdagi mahsulot topilmadi</p><p className="mt-1 text-sm text-muted-foreground">Qidiruv yoki kategoriya filtrini o‘zgartiring.</p></div>}
      </section>

      <aside className="h-fit rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-24">
        <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Yangi sotuv</h2><p className="mt-1 text-xs text-muted-foreground">{totalItems} ta mahsulot</p></div>{cart.length > 0 && <button type="button" onClick={() => setCart([])} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Savatni tozalash"><Trash2 className="size-4" /></button>}</div>

        {completedOrder && <div className="m-4 flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/[0.06] p-3"><span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check className="size-4" /></span><div><p className="text-sm font-semibold">Sotuv yakunlandi</p><p className="mt-0.5 text-xs text-muted-foreground">{completedOrder} buyurtma yaratildi.</p></div><button type="button" onClick={() => setCompletedOrder(null)} className="ml-auto cursor-pointer text-muted-foreground hover:text-foreground" aria-label="Xabarni yopish"><X className="size-4" /></button></div>}
        {saleError && <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-sm text-red-700">{saleError}</div>}

        <div className="max-h-[320px] divide-y divide-border overflow-y-auto">
          {cart.map((line) => (
            <div key={line.product.id} className="p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{line.product.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatMoney(line.product.price)} UZS</p></div><button type="button" onClick={() => setCart((current) => current.filter((item) => item.product.id !== line.product.id))} className="cursor-pointer text-muted-foreground hover:text-red-600" aria-label={`${line.product.name}ni savatdan olib tashlash`}><X className="size-4" /></button></div>
              <div className="mt-3 flex items-center justify-between"><div className="inline-flex items-center rounded-xl border border-border"><button type="button" onClick={() => updateQuantity(line.product.id, -1)} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-l-xl hover:bg-muted" aria-label="Miqdorni kamaytirish"><Minus className="size-3.5" /></button><span className="w-8 text-center text-sm font-semibold">{line.quantity}</span><button type="button" onClick={() => updateQuantity(line.product.id, 1)} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-r-xl hover:bg-muted" aria-label="Miqdorni oshirish"><Plus className="size-3.5" /></button></div><p className="text-sm font-semibold">{formatMoney(line.product.price * line.quantity)} UZS</p></div>
            </div>
          ))}
          {cart.length === 0 && <div className="px-5 py-12 text-center"><NexoraIcon name="sale" className="mx-auto size-9 text-brand" /><p className="mt-3 text-sm font-medium">Savat hozircha bo‘sh</p><p className="mt-1 text-xs text-muted-foreground">Chap tomondan mahsulot tanlang.</p></div>}
        </div>

        <div className="space-y-4 border-t border-border p-5">
          <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Mijoz (ixtiyoriy)</span><div className="relative"><NexoraIcon name="customer" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Ism yoki telefon" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></div></label>
          <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">Chegirma, UZS</span><div className="relative"><NexoraIcon name="discount" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="number" inputMode="numeric" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0" className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></div></label>
          <fieldset><legend className="text-xs font-medium text-muted-foreground">To‘lov usuli</legend><div className="mt-2 grid grid-cols-3 gap-2">{paymentMethods.map((method) => <button type="button" key={method.value} onClick={() => setPaymentMethod(method.value)} className={cn("flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", paymentMethod === method.value ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-muted")}><NexoraIcon name={method.icon} className="size-[18px]" />{method.label}</button>)}</div></fieldset>
          <div className="space-y-2 border-t border-border pt-4 text-sm"><div className="flex justify-between text-muted-foreground"><span>Oraliq summa</span><span>{formatMoney(subtotal)} UZS</span></div><div className="flex justify-between text-muted-foreground"><span>Chegirma</span><span>-{formatMoney(discountAmount)} UZS</span></div><div className="flex items-end justify-between pt-1"><span className="font-semibold">Jami</span><span className="text-xl font-semibold tracking-tight">{formatMoney(total)} UZS</span></div></div>
          <button type="button" onClick={() => void finishSale()} disabled={!cart.length || submitting} className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_10px_28px_rgba(16,161,132,0.22)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"><NexoraIcon name="check" className="size-[18px]" />{submitting ? "Saqlanmoqda..." : "Sotuvni yakunlash"}</button>
        </div>
      </aside>
    </div>
  );
}
