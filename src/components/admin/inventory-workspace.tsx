"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownToLine, Boxes, ChevronDown, Download, History, PackagePlus, Search, Warehouse, X } from "lucide-react";

import { useProductStore } from "@/components/admin/product-store";
import { apiRequest } from "@/lib/api-client";
import type { InventoryMovement, InventoryReport } from "@/lib/commerce";
import { cn } from "@/lib/utils";

const formatMoney = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const movementLabels: Record<string, string> = { restock: "Kirim", adjustment: "Tuzatish", return: "Qaytarish", sale: "Sotuv" };
const formatMovement = (movement: InventoryMovement) => ({
  id: `MOV-${movement.id}`,
  product: movement.productName,
  type: movementLabels[movement.type] ?? movement.type,
  quantity: `${movement.quantity > 0 ? "+" : ""}${movement.quantity}`,
  location: movement.location,
  time: new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(`${movement.createdAt}Z`)),
});

export function InventoryWorkspace() {
  const { products, restockProduct } = useProductStore();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [restockId, setRestockId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("10");
  const [movements, setMovements] = useState<ReturnType<typeof formatMovement>[]>([]);
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [restocking, setRestocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const selectedProduct = products.find((product) => product.id === restockId);
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.costPrice * product.stock, 0);
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;

  useEffect(() => {
    Promise.all([
      apiRequest<{ movements: InventoryMovement[] }>("/api/inventory"),
      apiRequest<{ report: InventoryReport }>("/api/reports/inventory?threshold=5"),
    ])
      .then(([movementPayload, reportPayload]) => { setMovements(movementPayload.movements.map(formatMovement)); setReport(reportPayload.report); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Ombor harakatlari yuklanmadi"));
  }, []);

  const finishRestock = async () => {
    if (!selectedProduct || Number(quantity) <= 0) return;
    setRestocking(true);
    setError(null);
    try {
      await restockProduct(selectedProduct.id, Number(quantity));
      const payload = await apiRequest<{ movements: InventoryMovement[] }>("/api/inventory");
      setMovements(payload.movements.map(formatMovement));
      const reportPayload = await apiRequest<{ report: InventoryReport }>("/api/reports/inventory?threshold=5");
      setReport(reportPayload.report);
      setRestockId(null);
      setQuantity("10");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kirim saqlanmadi");
    } finally {
      setRestocking(false);
    }
  };

  const metrics = [
    { label: "Jami qoldiq", value: `${report?.summary.unitsOnHand ?? totalUnits} dona`, note: `${report?.summary.reservedUnits ?? 0} dona rezervda`, icon: Boxes, className: "bg-brand/10 text-brand" },
    { label: "Ombor qiymati", value: `${((report?.summary.inventoryCostValue ?? inventoryValue) / 1_000_000).toFixed(1)} mln`, note: "kirim narxida", icon: Warehouse, className: "bg-blue-500/10 text-blue-600" },
    { label: "Kam qoldiq", value: `${report?.summary.lowStockCount ?? lowStock} ta`, note: "available 5 donadan kam", icon: AlertTriangle, className: "bg-amber-500/10 text-amber-600" },
    { label: "Tugagan", value: `${report?.summary.outOfStockCount ?? outOfStock} ta`, note: "available qoldiq 0", icon: ArrowDownToLine, className: "bg-red-500/10 text-red-600" },
  ];

  return <div className="space-y-5"><div className="flex justify-end"><Link href="/api/reports/export?report=inventory" className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold"><Download className="size-4" />Inventory CSV</Link></div>{error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-700">{error}</div>}<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon, className }) => <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><span className={cn("inline-flex size-10 items-center justify-center rounded-xl", className)}><Icon className="size-[18px]" /></span><p className="text-2xl font-semibold">{value}</p></div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></article>)}</section><div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.7fr)]"><section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Ombordan mahsulot qidirish" placeholder="Nomi, SKU yoki kategoriya..." className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><div className="relative"><select value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Ombor lokatsiyasi" className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background pl-3 pr-9 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"><option value="all">Barcha lokatsiyalar</option><option>Asosiy ombor</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div></div><div className="divide-y divide-border">{filtered.map((product) => <article key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">{product.name.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.category}</p></div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><p className={cn("font-semibold", product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-amber-600" : "text-brand")}>{product.stock} dona</p><p className="mt-1 text-xs text-muted-foreground">{formatMoney(product.costPrice * product.stock)} UZS</p></div><button type="button" onClick={() => setRestockId(product.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-brand px-3 text-xs font-semibold text-white hover:opacity-85"><PackagePlus className="size-4" />Kirim</button></div></article>)}</div><div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Persistent stock · variant va rezerv bilan sinxron</div></section><aside className="h-fit rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-24"><div className="flex items-center gap-2 border-b border-border p-5"><History className="size-[18px] text-brand" /><div><h2 className="font-semibold">So‘nggi harakatlar</h2><p className="mt-1 text-xs text-muted-foreground">Kirim, sotuv va tuzatishlar</p></div></div><div className="divide-y divide-border">{movements.slice(0, 6).map((movement) => <div key={movement.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{movement.product}</p><p className="mt-1 text-xs text-muted-foreground">{movement.id} · {movement.location}</p></div><span className={cn("text-sm font-semibold", movement.quantity.startsWith("+") ? "text-brand" : "text-red-600")}>{movement.quantity}</span></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{movement.type}</span><span>{movement.time}</span></div></div>)}{movements.length === 0 && <p className="p-5 text-sm text-muted-foreground">Hali ombor harakati yo‘q.</p>}</div></aside></div>{selectedProduct && <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="restock-title"><button type="button" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" onClick={() => setRestockId(null)} aria-label="Kirim oynasini yopish" /><div className="relative w-full rounded-t-3xl bg-background p-5 shadow-2xl sm:max-w-md sm:rounded-3xl"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-brand">Yangi kirim</p><h2 id="restock-title" className="mt-1 text-xl font-semibold">{selectedProduct.name}</h2></div><button type="button" onClick={() => setRestockId(null)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl bg-muted" aria-label="Yopish"><X className="size-4" /></button></div><div className="mt-6 rounded-2xl bg-muted p-4"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Joriy qoldiq</span><strong>{selectedProduct.stock} dona</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Kirimdan keyin</span><strong className="text-brand">{selectedProduct.stock + (Number(quantity) || 0)} dona</strong></div></div><label className="mt-5 block space-y-2"><span className="text-sm font-medium">Kirim miqdori</span><input autoFocus type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label><button type="button" onClick={() => void finishRestock()} disabled={Number(quantity) <= 0 || restocking} className="mt-5 h-11 w-full cursor-pointer rounded-xl bg-brand text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{restocking ? "Saqlanmoqda..." : "Kirimni tasdiqlash"}</button></div></div>}</div>;
}
