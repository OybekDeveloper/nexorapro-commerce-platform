"use client";

import { useMemo, useState } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, Check, ChevronDown, Eye, EyeOff, Filter, Languages, Plus, Search, Video, X } from "lucide-react";

import { useProductStore } from "@/components/admin/product-store";
import type { Product, ProductCategory, ProductStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const formatMoney = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const columnHelper = createColumnHelper<Product>();

const statusMeta: Record<ProductStatus, { label: string; className: string }> = {
  published: { label: "Sotuvda", className: "bg-brand/10 text-brand" },
  draft: { label: "Qoralama", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  archived: { label: "Arxiv", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
};

const categories: ProductCategory[] = ["Smartfon", "Noutbuk", "Audio", "Planshet", "Aksessuar"];

export function ProductsTable() {
  const { products: items, addProduct, toggleVisibility, archiveProduct } = useProductStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredItems = useMemo(() => items.filter((product) => status === "all" || product.status === status), [items, status]);

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Mahsulot",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
            {row.original.name.slice(0, 2).toUpperCase()}
          </div>
          <div><p className="font-semibold">{row.original.name}</p><div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"><span>{row.original.sku}</span>{row.original.videoUrl && <span className="inline-flex items-center gap-1 text-brand"><Video className="size-3" />Video</span>}</div></div>
        </div>
      ),
    }),
    columnHelper.accessor("category", { header: "Kategoriya", cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span> }),
    columnHelper.accessor("price", { header: "Narx", cell: (info) => <span className="whitespace-nowrap font-medium">{formatMoney(info.getValue())} UZS</span> }),
    columnHelper.accessor("stock", {
      header: "Ombor",
      cell: (info) => <span className={cn("whitespace-nowrap font-medium", info.getValue() === 0 ? "text-red-600" : info.getValue() <= 5 ? "text-amber-600" : "")}>{info.getValue()} dona</span>,
    }),
    columnHelper.accessor("languages", {
      header: "Tillar",
      cell: (info) => <div className="flex gap-1">{info.getValue().map((language) => <span key={language} className="rounded-md bg-muted px-1.5 py-1 text-[10px] font-bold text-muted-foreground">{language}</span>)}</div>,
    }),
    columnHelper.accessor("status", {
      header: "Holat",
      cell: (info) => <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusMeta[info.getValue()].className)}>{statusMeta[info.getValue()].label}</span>,
    }),
    columnHelper.display({
      id: "visibility",
      header: "Saytda",
      cell: ({ row }) => (
        <button type="button" onClick={() => toggleVisibility(row.original.id)} className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", row.original.visibleOnStorefront ? "bg-brand/10 text-brand hover:bg-brand/15" : "bg-muted text-muted-foreground hover:text-foreground")} aria-label={`${row.original.name} mahsulotining saytdagi ko‘rinishini almashtirish`}>
          {row.original.visibleOnStorefront ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {row.original.visibleOnStorefront ? "Ko‘rinadi" : "Yashirin"}
        </button>
      ),
    }),
    columnHelper.display({ id: "actions", cell: ({ row }) => <button type="button" onClick={() => void archiveProduct(row.original.id)} disabled={row.original.status === "archived"} aria-label={`${row.original.name}ni arxivlash`} title="Arxivlash" className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30"><Archive className="size-4" /></button> }),
  ], [archiveProduct, toggleVisibility]);

  // TanStack Table intentionally exposes non-memoizable functions; React Compiler skips this hook safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filteredItems, columns, state: { globalFilter: query }, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

  const handleAddProduct = async (product: Omit<Product, "id" | "sales">) => {
    await addProduct(product);
    setDialogOpen(false);
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="product-search" className="sr-only">Mahsulot qidirish</label>
            <input id="product-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomi yoki SKU bo‘yicha..." className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select aria-label="Mahsulot holati" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background pl-9 pr-9 text-sm font-medium outline-none focus:ring-2 focus:ring-ring sm:w-auto">
                <option value="all">Barcha holatlar</option><option value="published">Sotuvda</option><option value="draft">Qoralama</option><option value="archived">Arxiv</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button type="button" onClick={() => setDialogOpen(true)} className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,161,132,0.18)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Plus className="size-4" /><span className="hidden sm:inline">Mahsulot qo‘shish</span><span className="sm:hidden">Qo‘shish</span>
            </button>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3 font-medium first:pl-5 last:w-12">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>)}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-muted/35">{row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-4 first:pl-5">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border lg:hidden">
          {table.getRowModel().rows.map((row) => {
            const product = row.original;
            return (
              <article key={product.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.category}</p></div>
                  <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-semibold", statusMeta[product.status].className)}>{statusMeta[product.status].label}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Narx</p><p className="mt-1 font-medium">{formatMoney(product.price)} UZS</p></div><div><p className="text-xs text-muted-foreground">Ombor</p><p className="mt-1 font-medium">{product.stock} dona</p></div></div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1"><Languages className="mr-1 size-4 text-muted-foreground" />{product.languages.map((language) => <span key={language} className="rounded-md bg-muted px-1.5 py-1 text-[10px] font-bold">{language}</span>)}</div>
                  <button type="button" onClick={() => toggleVisibility(product.id)} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-semibold transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{product.visibleOnStorefront ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}{product.visibleOnStorefront ? "Ko‘rinadi" : "Yashirin"}</button>
                </div>
              </article>
            );
          })}
        </div>

        {table.getRowModel().rows.length === 0 && <div className="px-5 py-16 text-center"><p className="font-medium">Mahsulot topilmadi</p><p className="mt-1 text-sm text-muted-foreground">Qidiruv yoki filtrni o‘zgartirib ko‘ring.</p></div>}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>{table.getRowModel().rows.length} ta mahsulot ko‘rsatilmoqda</span><span>Persistent API</span></div>
      </div>

      {dialogOpen && <AddProductDialog onClose={() => setDialogOpen(false)} onAdd={handleAddProduct} />}
    </>
  );
}

function AddProductDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (product: Omit<Product, "id" | "sales">) => Promise<void> }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Smartfon");
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPosterUrl, setVideoPosterUrl] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [visibleOnStorefront, setVisibleOnStorefront] = useState(false);
  const [languages, setLanguages] = useState<Array<"UZ" | "RU" | "EN">>(["UZ"]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canSubmit = Boolean(name.trim() && sku.trim() && Number(costPrice) > 0 && Number(price) > 0);
  const expectedProfit = Math.max(0, Number(price) - Number(costPrice));
  const margin = Number(price) > 0 ? Math.round((expectedProfit / Number(price)) * 100) : 0;

  const toggleLanguage = (language: "UZ" | "RU" | "EN") => setLanguages((current) => current.includes(language) ? current.filter((item) => item !== language) : [...current, language]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
      <button type="button" className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Oynani yopish" />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit) return;
          setSubmitting(true);
          setSubmitError(null);
          try {
            await onAdd({
              name: name.trim(), sku: sku.trim().toUpperCase(), category,
              costPrice: Number(costPrice), price: Number(price),
              compareAtPrice: Number(compareAtPrice) || undefined,
              videoUrl: videoUrl.trim() || undefined, videoPosterUrl: videoPosterUrl.trim() || undefined,
              stock: Number(stock) || 0, status,
              visibleOnStorefront: status === "published" && visibleOnStorefront,
              languages: languages.length ? languages : ["UZ"],
            });
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Mahsulot yaratilmadi");
          } finally {
            setSubmitting(false);
          }
        }}
        className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-background shadow-2xl sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur-xl">
          <div><h2 id="add-product-title" className="font-semibold">Yangi mahsulot</h2><p className="mt-0.5 text-xs text-muted-foreground">Katalog, sotuv va e’lon sozlamalari</p></div>
          <button type="button" onClick={onClose} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Oynani yopish"><X className="size-5" /></button>
        </div>
        <div className="space-y-6 p-5">
          <section>
            <div className="mb-3"><h3 className="text-sm font-semibold">Asosiy ma’lumot</h3><p className="mt-0.5 text-xs text-muted-foreground">Mahsulot katalogda qanday tanilishini belgilang.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Mahsulot nomi <span className="text-brand">*</span></span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, iPhone 16 Pro" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">SKU <span className="text-brand">*</span></span><input required value={sku} onChange={(event) => setSku(event.target.value)} placeholder="APL-IP16P-256" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Kategoriya</span><select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)} className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-muted/35 p-4">
            <div className="mb-3 flex items-start gap-3"><span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Video className="size-4" /></span><div><h3 className="text-sm font-semibold">Mahsulot videosi</h3><p className="mt-0.5 text-xs text-muted-foreground">MP4 video va poster URL kiriting. Video storefront’da viewport’ga kelgandagina yuklanadi.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-medium">Video URL</span><input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://cdn.example.com/product.mp4" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Poster URL</span><input type="url" value={videoPosterUrl} onChange={(event) => setVideoPosterUrl(event.target.value)} placeholder="https://cdn.example.com/poster.jpg" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-brand/20 bg-brand/[0.035] p-4">
            <div className="mb-3"><h3 className="text-sm font-semibold">Sotuv va foyda</h3><p className="mt-0.5 text-xs text-muted-foreground">Kirim va sotuv narxidan taxminiy marja hisoblanadi.</p></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5"><span className="text-sm font-medium">Kirim narxi <span className="text-brand">*</span></span><input required type="number" inputMode="numeric" min="1" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} placeholder="14800000" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Sotuv narxi <span className="text-brand">*</span></span><input required type="number" inputMode="numeric" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="16999000" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Eski narx</span><input type="number" inputMode="numeric" min="0" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} placeholder="17999000" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-background px-3 py-2.5 text-xs">
              <span className="text-muted-foreground">Taxminiy foyda: <strong className="text-foreground">{formatMoney(expectedProfit)} UZS</strong></span>
              <span className="text-muted-foreground">Marja: <strong className="text-brand">{margin}%</strong></span>
              {Number(costPrice) > Number(price) && Number(price) > 0 && <span className="text-red-600">Sotuv narxi kirim narxidan past.</span>}
            </div>
          </section>

          <section>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-sm font-medium">Boshlang‘ich qoldiq</span><input type="number" inputMode="numeric" min="0" value={stock} onChange={(event) => setStock(event.target.value)} placeholder="0" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Mahsulot holati</span><select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="draft">Qoralama</option><option value="published">Sotuvda</option><option value="archived">Arxiv</option></select></label>
            </div>
            <fieldset className="mt-4"><legend className="text-sm font-medium">Kontent tillari</legend><div className="mt-2 flex gap-2">{(["UZ", "RU", "EN"] as const).map((language) => { const active = languages.includes(language); return <button type="button" key={language} onClick={() => toggleLanguage(language)} className={cn("inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-muted")} aria-pressed={active}>{active && <Check className="size-4" />}{language}</button>; })}</div></fieldset>
            <label className={cn("mt-4 flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors", status === "published" ? "border-brand/25 bg-brand/[0.035]" : "border-border bg-muted/40 opacity-60")}>
              <span><span className="block text-sm font-medium">Storefront’da ko‘rsatish</span><span className="mt-0.5 block text-xs text-muted-foreground">Faqat “Sotuvda” holatidagi mahsulot e’lon qilinadi.</span></span>
              <input type="checkbox" checked={visibleOnStorefront && status === "published"} disabled={status !== "published"} onChange={(event) => setVisibleOnStorefront(event.target.checked)} className="size-5 cursor-pointer accent-[#10a184] disabled:cursor-not-allowed" />
            </label>
          </section>
        </div>
        {submitError && <p className="mx-5 mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{submitError}</p>}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-xl"><button type="button" onClick={onClose} className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Bekor qilish</button><button type="submit" disabled={!canSubmit || submitting} className="h-10 cursor-pointer rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40">{submitting ? "Saqlanmoqda..." : "Mahsulotni yaratish"}</button></div>
      </form>
    </div>
  );
}
