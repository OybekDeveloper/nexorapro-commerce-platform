"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  CreditCard,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import {
  LocationPicker,
  type MapLocation,
} from "@/components/maps/location-picker";
import { apiRequest } from "@/lib/api-client";
import type { CommerceOrder, PaymentMethod } from "@/lib/commerce";
import { formatStoreMoney } from "@/lib/storefront-data";
import {
  canUseStoreMotion,
  loadGsap,
  prefersCompactMotion,
} from "@/lib/storefront-motion";

const copy = {
  UZ: { promoOk: "10% chegirma qo‘llandi.", promoBad: "Promo kod topilmadi. Demo kod: NEXORA10", accepted: "Buyurtma qabul qilindi", thanks: "Rahmat! Xarid muvaffaqiyatli yakunlandi.", orderNumber: "Buyurtma raqami", saved: "Buyurtma serverda saqlandi va admin panelida boshqariladi.", back: "Katalogga qaytish", orders: "Buyurtmalarim", empty: "Savatingiz hozircha bo‘sh.", emptyHint: "Katalogdan mahsulot tanlang. Qo‘shilgan mahsulotlar sahifalar orasida saqlanadi.", openCatalog: "Katalogni ochish", choice: "Sizning tanlovingiz", cart: "Savat", itemsDelivery: "ta mahsulot · Toshkent bo‘ylab bepul yetkazib berish", clearCart: "Savatni tozalash", remove: "savatdan olib tashlash", quantity: "Miqdor", decrease: "Miqdorni kamaytirish", increase: "Miqdorni oshirish", total: "Jami", perks: [["Bepul yetkazish", "Toshkent bo‘ylab"], ["Kafolat", "Tekshirilgan mahsulot"], ["Qulay qaytarish", "14 kun ichida"]], summary: "Buyurtma xulosasi", products: "Mahsulotlar", delivery: "Yetkazib berish", free: "Bepul", discount: "Promo chegirma", promo: "Promo kod", apply: "Qo‘llash", checkout: "Xaridni davom ettirish", login: "Email orqali kirish", accountRequired: "Xarid uchun akkaunt talab qilinadi." },
  RU: { promoOk: "Скидка 10% применена.", promoBad: "Промокод не найден. Демо-код: NEXORA10", accepted: "Заказ принят", thanks: "Спасибо! Покупка успешно оформлена.", orderNumber: "Номер заказа", saved: "Заказ сохранён на сервере и доступен в панели администратора.", back: "Вернуться в каталог", orders: "Мои заказы", empty: "Ваша корзина пока пуста.", emptyHint: "Выберите товар в каталоге. Добавленные товары сохраняются между страницами.", openCatalog: "Открыть каталог", choice: "Ваш выбор", cart: "Корзина", itemsDelivery: "товаров · бесплатная доставка по Ташкенту", clearCart: "Очистить корзину", remove: "удалить из корзины", quantity: "Количество", decrease: "Уменьшить количество", increase: "Увеличить количество", total: "Итого", perks: [["Бесплатная доставка", "По Ташкенту"], ["Гарантия", "Проверенный товар"], ["Удобный возврат", "В течение 14 дней"]], summary: "Итоги заказа", products: "Товары", delivery: "Доставка", free: "Бесплатно", discount: "Скидка по промокоду", promo: "Промокод", apply: "Применить", checkout: "Продолжить оформление", login: "Войти по email", accountRequired: "Для оформления требуется аккаунт." },
  EN: { promoOk: "10% discount applied.", promoBad: "Promo code not found. Demo code: NEXORA10", accepted: "Order received", thanks: "Thank you! Checkout completed successfully.", orderNumber: "Order number", saved: "The order was saved on the server and is available in the admin panel.", back: "Back to catalog", orders: "My orders", empty: "Your cart is currently empty.", emptyHint: "Choose a product from the catalog. Added items persist between pages.", openCatalog: "Open catalog", choice: "Your selection", cart: "Cart", itemsDelivery: "items · free delivery across Tashkent", clearCart: "Clear cart", remove: "remove from cart", quantity: "Quantity", decrease: "Decrease quantity", increase: "Increase quantity", total: "Total", perks: [["Free delivery", "Across Tashkent"], ["Warranty", "Verified product"], ["Easy returns", "Within 14 days"]], summary: "Order summary", products: "Products", delivery: "Delivery", free: "Free", discount: "Promo discount", promo: "Promo code", apply: "Apply", checkout: "Continue checkout", login: "Sign in with email", accountRequired: "An account is required for checkout." },
} satisfies Record<StoreLocale, Record<string, string | string[][]>>;

export function CartPageContent() {
  const {
    cartLines,
    cartCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    user,
    locale,
  } = useStore();
  const labels = copy[locale];
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const completeCheckout = async (details: {
    name: string;
    phone: string;
    location: MapLocation;
    payment: PaymentMethod;
  }) => {
    const payload = await apiRequest<{ order: CommerceOrder }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customer: details.name,
        phone: details.phone,
        address: details.location.address,
        addressLatitude: details.location.latitude,
        addressLongitude: details.location.longitude,
        payment: details.payment,
        channel: "Online",
        discount,
        items: cartLines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      }),
    });
    setCompletedOrder(payload.order.id);
    setCheckoutOpen(false);
    clearCart();
  };

  const applyPromo = () => {
    const valid = promo.trim().toUpperCase() === "NEXORA10";
    setPromoApplied(valid);
    setPromoMessage(valid ? String(labels.promoOk) : String(labels.promoBad));
  };

  if (completedOrder) {
    return (
      <main
        id="main-content"
        className="min-h-[70vh] bg-[#f5f5f7] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div
          data-motion-hero
          className="mx-auto max-w-2xl rounded-[2rem] border border-brand/20 bg-white p-8 text-center shadow-[0_24px_80px_rgba(16,161,132,0.12)] sm:p-12"
        >
          <span
            data-motion-hero-item
            className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-brand text-white"
          >
            <Check className="size-8" />
          </span>
          <p
            data-motion-hero-item
            className="mt-6 text-sm font-semibold text-brand"
          >
            {String(labels.accepted)}
          </p>
          <h1
            data-motion-hero-item
            className="mt-2 text-3xl font-semibold tracking-[-0.04em]"
          >
            {String(labels.thanks)}
          </h1>
          <p data-motion-hero-item className="mt-4 text-zinc-600">
            {String(labels.orderNumber)}{" "}
            <strong className="text-[#1d1d1f]">{completedOrder}</strong>.
            {String(labels.saved)}
          </p>
          <div
            data-motion-hero-item
            className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/catalog"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white"
            >
              {String(labels.back)}
            </Link>
            <Link
              href="/account"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-zinc-100 px-6 text-sm font-semibold"
            >
              {String(labels.orders)}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (cartLines.length === 0) {
    return (
      <main
        id="main-content"
        className="min-h-[70vh] bg-[#f5f5f7] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div
          data-motion-hero
          className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center sm:p-12"
        >
          <span
            data-motion-hero-item
            className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand"
          >
            <ShoppingBag className="size-7" />
          </span>
          <h1
            data-motion-hero-item
            className="mt-6 text-3xl font-semibold tracking-[-0.04em]"
          >
            {String(labels.empty)}
          </h1>
          <p
            data-motion-hero-item
            className="mx-auto mt-3 max-w-md text-zinc-600"
          >
            {String(labels.emptyHint)}
          </p>
          <Link
            data-motion-hero-item
            href="/catalog"
            className="mt-7 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white"
          >
            {String(labels.openCatalog)} <ChevronRight className="size-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#f5f5f7] px-4 py-10 text-[#1d1d1f] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div
          data-motion-hero
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p
              data-motion-hero-item
              className="text-sm font-semibold text-brand"
            >
              {String(labels.choice)}
            </p>
            <h1
              data-motion-hero-item
              className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl"
            >
              {String(labels.cart)}.
            </h1>
            <p data-motion-hero-item className="mt-3 text-zinc-600">
              {cartCount} {String(labels.itemsDelivery)}
            </p>
          </div>
          <button
            data-motion-hero-item
            type="button"
            onClick={clearCart}
            className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-full px-3 text-sm font-semibold text-zinc-500 transition-colors hover:bg-white hover:text-red-600"
          >
            <Trash2 className="size-4" />
            {String(labels.clearCart)}
          </button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section
            data-motion-reveal
            className="overflow-hidden rounded-[1.75rem] bg-white"
          >
            <div className="divide-y divide-black/[0.06]">
              {cartLines.map(({ product, quantity }) => (
                <article
                  key={product.id}
                  data-motion-card
                  className="grid gap-5 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-7"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    data-shared-product={product.slug}
                    data-shared-product-frame
                    className="relative aspect-[1.45/1] cursor-pointer overflow-hidden rounded-2xl bg-zinc-100 sm:aspect-auto sm:min-h-36"
                  >
                    <Image
                      src={product.image}
                      alt={product.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 180px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          {product.category}
                        </p>
                        <Link
                          href={`/product/${product.slug}`}
                          className="mt-1 block cursor-pointer text-xl font-semibold hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-sm text-zinc-500">
                          {product.specs.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`${product.name}: ${String(labels.remove)}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
                      <div>
                        <p className="text-xs text-zinc-500">{String(labels.quantity)}</p>
                        <div className="mt-2 inline-flex items-center rounded-full border border-black/10">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-l-full hover:bg-zinc-100"
                            aria-label={String(labels.decrease)}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-r-full hover:bg-zinc-100"
                            aria-label={String(labels.increase)}
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">{String(labels.total)}</p>
                        <p className="mt-1 text-lg font-semibold">
                          {formatStoreMoney(product.price * quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="grid gap-3 border-t border-black/5 bg-zinc-50 p-5 sm:grid-cols-3 sm:p-6">
              {([Truck, ShieldCheck, PackageCheck] as const).map((Icon, index) => {
                const [title, text] = (labels.perks as string[][])[index];
                const Component = Icon;
                return (
                  <div key={String(title)} className="flex gap-3">
                    <Component className="mt-0.5 size-5 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-semibold">{String(title)}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {String(text)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside
            data-motion-reveal
            className="h-fit rounded-[1.75rem] bg-white p-5 shadow-[0_16px_50px_rgba(0,0,0,0.06)] sm:p-6 lg:sticky lg:top-24"
          >
            <h2 className="text-xl font-semibold">{String(labels.summary)}</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>{String(labels.products)}</span>
                <span>{formatStoreMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>{String(labels.delivery)}</span>
                <span className="font-semibold text-brand">{String(labels.free)}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between text-zinc-600">
                  <span>{String(labels.discount)}</span>
                  <span className="font-semibold text-brand">
                    -{formatStoreMoney(discount)}
                  </span>
                </div>
              )}
              <div className="flex items-end justify-between border-t border-black/10 pt-4">
                <span className="font-semibold">{String(labels.total)}</span>
                <span className="text-2xl font-semibold tracking-tight">
                  {formatStoreMoney(total)}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <label
                htmlFor="promo-code"
                className="text-xs font-semibold text-zinc-600"
              >
                {String(labels.promo)}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="promo-code"
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                  placeholder="NEXORA10"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-black/10 px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="h-11 cursor-pointer rounded-xl bg-zinc-100 px-4 text-sm font-semibold hover:bg-zinc-200"
                >
                  {String(labels.apply)}
                </button>
              </div>
              {promoMessage && (
                <p
                  className={`mt-2 text-xs ${promoApplied ? "text-brand" : "text-amber-700"}`}
                >
                  {promoMessage}
                </p>
              )}
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="mt-6 inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,161,132,0.22)] transition-opacity hover:opacity-85"
              >
                <CreditCard className="size-4" />
                {String(labels.checkout)}
              </button>
            ) : (
              <Link
                href="/login?next=/cart"
                className="mt-6 inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,161,132,0.22)]"
              >
                <CreditCard className="size-4" />
                {String(labels.login)}
              </Link>
            )}
            <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
              {user
                ? `${user.email} sifatida xarid qilasiz.`
                : String(labels.accountRequired)}
            </p>
          </aside>
        </div>
      </div>

      {checkoutOpen && user && (
        <CheckoutDialog
          total={total}
          initialName={user.name}
          onClose={() => setCheckoutOpen(false)}
          onComplete={completeCheckout}
        />
      )}
    </main>
  );
}

function CheckoutDialog({
  total,
  initialName,
  onClose,
  onComplete,
}: {
  total: number;
  initialName: string;
  onClose: () => void;
  onComplete: (details: {
    name: string;
    phone: string;
    location: MapLocation;
    payment: PaymentMethod;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const canSubmit =
    name.trim().length > 2 &&
    phone.trim().length >= 7 &&
    Boolean(location?.address);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const dialog = dialogRef.current;
    if (!backdrop || !dialog || !canUseStoreMotion()) return;
    void loadGsap().then((gsap) => {
      const compact = prefersCompactMotion();
      gsap.fromTo(
        backdrop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: compact ? 0.12 : 0.18, ease: "power2.out" },
      );
      gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: compact ? 14 : 22, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: compact ? 0.25 : 0.34,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility,willChange",
        },
      );
    });
    return () => {
      void loadGsap().then((gsap) => {
        gsap.killTweensOf(backdrop);
        gsap.killTweensOf(dialog);
      });
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Checkout oynasini yopish"
      />
      <form
        ref={dialogRef}
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit || !location) return;
          setSubmitting(true);
          setError(null);
          try {
            await onComplete({ name, phone, location, payment });
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Buyurtma yaratilmadi",
            );
            setSubmitting(false);
          }
        }}
        className="relative max-h-[96vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-xs font-semibold text-brand">Xavfsiz checkout</p>
            <h2 id="checkout-title" className="mt-1 text-xl font-semibold">
              Yetkazib berish ma’lumotlari
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-zinc-100"
            aria-label="Yopish"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Ism va familiya</span>
              <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Oybek Developer"
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Telefon</span>
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Yetkazib berish manzili</p>
              {location && (
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  Nuqta tanlandi
                </span>
              )}
            </div>
            <LocationPicker
              value={location}
              onChange={setLocation}
              height={280}
            />
            {location && (
              <p className="mt-2 rounded-xl bg-brand/[0.06] px-3 py-2 text-sm font-medium text-zinc-700">
                {location.address}
              </p>
            )}
          </div>
          <fieldset>
            <legend className="text-sm font-medium">To‘lov usuli</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["card", "Karta"],
                  ["cash", "Naqd"],
                  ["installment", "Bo‘lib to‘lash"],
                ] as Array<[PaymentMethod, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPayment(value)}
                  className={`min-h-16 cursor-pointer rounded-xl border px-2 text-xs font-semibold transition-colors ${payment === value ? "border-brand bg-brand/10 text-brand" : "border-black/10 hover:bg-zinc-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="rounded-2xl bg-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">To‘lov summasi</span>
              <strong>{formatStoreMoney(total)}</strong>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Manzil va koordinatalar order bilan saqlanadi. Portfolio rejimida
              real pul yechilmaydi.
            </p>
          </div>
          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="sticky bottom-0 border-t border-black/10 bg-white/95 p-5 backdrop-blur-xl sm:px-6">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="h-12 w-full cursor-pointer rounded-full bg-brand text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? "Buyurtma saqlanmoqda..."
              : location
                ? "Buyurtmani tasdiqlash"
                : "Xaritadan manzil tanlang"}
          </button>
        </div>
      </form>
    </div>
  );
}
