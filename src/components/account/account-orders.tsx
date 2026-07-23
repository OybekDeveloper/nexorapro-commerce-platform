"use client";

import {
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LocationPicker } from "@/components/maps/location-picker";
import type { CommerceOrder, OrderStatus } from "@/lib/commerce";
import { formatStoreMoney } from "@/lib/storefront-data";

const statusMeta: Record<
  OrderStatus,
  { label: string; description: string; className: string }
> = {
  new: {
    label: "Qabul qilindi",
    description: "Buyurtma do‘konga yuborildi",
    className: "bg-blue-50 text-blue-700",
  },
  paid: {
    label: "To‘landi",
    description: "To‘lov tasdiqlandi",
    className: "bg-brand/10 text-brand",
  },
  packing: {
    label: "Tayyorlanmoqda",
    description: "Mahsulotlar yig‘ilmoqda",
    className: "bg-amber-50 text-amber-700",
  },
  shipping: {
    label: "Yetkazilmoqda",
    description: "Kuryer manzilga yo‘l oldi",
    className: "bg-violet-50 text-violet-700",
  },
  completed: {
    label: "Yetkazildi",
    description: "Buyurtma muvaffaqiyatli yakunlandi",
    className: "bg-brand/10 text-brand",
  },
  cancelled: {
    label: "Bekor qilindi",
    description: "Buyurtma bekor qilingan",
    className: "bg-red-50 text-red-700",
  },
};

const stages: OrderStatus[] = [
  "new",
  "paid",
  "packing",
  "shipping",
  "completed",
];
const paymentLabels: Record<string, string> = {
  cash: "Naqd",
  card: "Karta",
  installment: "Bo‘lib to‘lash",
  click: "Click",
  payme: "Payme",
};

function parseOrderDate(value: string) {
  return new Date(
    /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`,
  );
}

const monthNames = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

function formatOrderDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(parseOrderDate(value));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("day")}-${monthNames[Number(read("month")) - 1]}, ${read("year")}, ${read("hour")}:${read("minute")}`;
}

function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled")
    return (
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-700">
        <X className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">Buyurtma bekor qilindi</p>
          <p className="mt-1 text-sm">
            Qo‘shimcha ma’lumot uchun do‘kon bilan bog‘laning.
          </p>
        </div>
      </div>
    );
  const currentIndex = stages.indexOf(status);
  return (
    <ol className="mt-5 grid gap-2 sm:grid-cols-5">
      {stages.map((stage, index) => {
        const reached = index <= currentIndex;
        const current = index === currentIndex;
        const Icon =
          stage === "new"
            ? Clock3
            : stage === "packing"
              ? PackageCheck
              : stage === "shipping"
                ? Truck
                : Check;
        return (
          <li
            key={stage}
            className={`rounded-2xl border p-3 ${current ? "border-brand bg-brand/[0.06]" : reached ? "border-brand/20 bg-white" : "border-black/5 bg-zinc-50 text-zinc-400"}`}
          >
            <span
              className={`inline-flex size-8 items-center justify-center rounded-full ${reached ? "bg-brand text-white" : "bg-zinc-200 text-zinc-500"}`}
            >
              <Icon className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold">
              {statusMeta[stage].label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function AccountOrders({
  initialOrders,
}: {
  initialOrders: CommerceOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const selected = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch("/api/account/orders", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { orders: CommerceOrder[] };
      setOrders(payload.orders);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Hidden tabs skip the poll; the focus listener catches up on return.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, 30_000);
    const onFocus = () => void refresh(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">Buyurtmalar tarixi</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
            Sizning xaridlaringiz.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm hover:text-brand disabled:opacity-50"
          aria-label="Statuslarni yangilash"
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] bg-white p-9 text-center">
          <PackageCheck className="mx-auto size-8 text-brand" />
          <p className="mt-4 font-semibold">Hali buyurtma yo‘q</p>
          <p className="mt-1 text-sm text-zinc-500">
            Checkout yakunlangach buyurtma shu yerda ko‘rinadi.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className="w-full cursor-pointer rounded-[1.5rem] bg-white p-5 text-left transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(0,0,0,0.07)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatOrderDate(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta[order.status].className}`}
                >
                  {statusMeta[order.status].label}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-4 border-t border-black/5 pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-sm text-zinc-600">
                  {order.items.map((item) => (
                    <p key={item.productId}>
                      {item.productName} × {item.quantity}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <strong className="text-lg">
                    {formatStoreMoney(order.total)}
                  </strong>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Batafsil <ChevronRight className="size-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
            aria-label="Buyurtmani yopish"
          />
          <article className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-3xl sm:rounded-[2rem]">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7">
              <div>
                <p className="text-xs font-semibold text-brand">
                  Buyurtma tafsiloti
                </p>
                <h2
                  id="order-detail-title"
                  className="mt-1 text-xl font-semibold"
                >
                  {selected.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-zinc-100"
                aria-label="Yopish"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">Joriy status</p>
                  <p className="mt-1 text-xl font-semibold">
                    {statusMeta[selected.status].label}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {statusMeta[selected.status].description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusMeta[selected.status].className}`}
                >
                  {statusMeta[selected.status].label}
                </span>
              </div>
              <OrderStatusTimeline status={selected.status} />
              <section className="rounded-2xl border border-black/10">
                <div className="border-b border-black/5 px-4 py-3">
                  <h3 className="font-semibold">Mahsulotlar</h3>
                </div>
                <div className="divide-y divide-black/5">
                  {selected.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start justify-between gap-4 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatStoreMoney(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <strong>
                        {formatStoreMoney(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-black/10 px-4 py-4">
                  <span className="font-semibold">Jami</span>
                  <strong className="text-lg">
                    {formatStoreMoney(selected.total)}
                  </strong>
                </div>
              </section>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Yetkazib berish
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {selected.address || "Manzil ko‘rsatilmagan"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">{selected.phone}</p>
                  {selected.addressLatitude !== undefined &&
                    selected.addressLongitude !== undefined && (
                      <a
                        href={`https://yandex.uz/maps/?pt=${selected.addressLongitude},${selected.addressLatitude}&z=17&l=map`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                      >
                        Yandex Maps’da ochish{" "}
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                </div>
                <div className="rounded-2xl bg-zinc-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    To‘lov
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {paymentLabels[selected.payment] ?? selected.payment}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Buyurtma sanasi: {formatOrderDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              {selected.addressLatitude !== undefined &&
                selected.addressLongitude !== undefined && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="size-4 text-brand" />
                      <h3 className="text-sm font-semibold">
                        Tanlangan yetkazib berish nuqtasi
                      </h3>
                    </div>
                    <LocationPicker
                      readOnly
                      value={{
                        latitude: selected.addressLatitude,
                        longitude: selected.addressLongitude,
                        address: selected.address,
                      }}
                      height={260}
                    />
                  </div>
                )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
