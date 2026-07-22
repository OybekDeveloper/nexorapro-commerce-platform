"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, ArchiveRestore, Check, ChevronDown, Download, Eye, EyeOff, Filter, Languages, Pencil, Plus, Search, Trash2, Upload, Video, X } from "lucide-react";

import { useProductStore, type NewProductInput } from "@/components/admin/product-store";
import type { CommerceProduct, ProductMediaInput, ProductVariantInput, UpdateProductInput } from "@/lib/commerce";
import type { ProductCategory, ProductLanguage, ProductStatus, ProductTranslation } from "@/lib/types";
import { cn } from "@/lib/utils";

const formatMoney = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const columnHelper = createColumnHelper<CommerceProduct>();

const statusMeta: Record<ProductStatus, { label: string; className: string }> = {
  published: { label: "Sotuvda", className: "bg-brand/10 text-brand" },
  draft: { label: "Qoralama", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  archived: { label: "Arxiv", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
};

const categories: ProductCategory[] = ["Smartfon", "Noutbuk", "Audio", "Planshet", "Aksessuar"];

export function ProductsTable() {
  const { products: items, addProduct, updateProduct, toggleVisibility, deleteProduct, bulkProducts, uploadProductImage, refreshProducts } = useProductStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProductStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommerceProduct | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredItems = useMemo(() => items.filter((product) => status === "all" || product.status === status), [items, status]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: "select",
      header: () => <input type="checkbox" aria-label="Barcha mahsulotlarni tanlash" checked={filteredItems.length > 0 && filteredItems.every((product) => selected.includes(product.id))} onChange={(event) => setSelected(event.target.checked ? filteredItems.map((product) => product.id) : [])} className="size-4 accent-[#10a184]" />,
      cell: ({ row }) => <input type="checkbox" aria-label={`${row.original.name}ni tanlash`} checked={selected.includes(row.original.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, row.original.id])] : current.filter((id) => id !== row.original.id))} className="size-4 accent-[#10a184]" />,
    }),
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
        <button type="button" disabled={Boolean(row.original.deletedAt)} onClick={() => toggleVisibility(row.original.id)} className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40", row.original.visibleOnStorefront ? "bg-brand/10 text-brand hover:bg-brand/15" : "bg-muted text-muted-foreground hover:text-foreground")} aria-label={`${row.original.name} mahsulotining saytdagi ko‘rinishini almashtirish`}>
          {row.original.visibleOnStorefront ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {row.original.visibleOnStorefront ? "Ko‘rinadi" : "Yashirin"}
        </button>
      ),
    }),
    columnHelper.display({ id: "actions", cell: ({ row }) => row.original.deletedAt ? <button type="button" onClick={() => void bulkProducts([row.original.id], "restore")} aria-label={`${row.original.name}ni tiklash`} title="Tiklash" className="inline-flex size-8 items-center justify-center rounded-lg text-brand hover:bg-brand/10"><ArchiveRestore className="size-4" /></button> : <div className="flex items-center gap-1"><button type="button" onClick={() => setEditing(row.original)} aria-label={`${row.original.name}ni tahrirlash`} title="Tahrirlash" className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-brand"><Pencil className="size-4" /></button><button type="button" onClick={() => { if (window.confirm(`${row.original.name} o‘chirilsinmi? Uni tiklash mumkin.`)) void deleteProduct(row.original.id); }} aria-label={`${row.original.name}ni o‘chirish`} title="O‘chirish" className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-red-600"><Trash2 className="size-4" /></button></div> }),
  ], [bulkProducts, deleteProduct, filteredItems, selected, toggleVisibility]);

  // TanStack Table intentionally exposes non-memoizable functions; React Compiler skips this hook safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: filteredItems, columns, state: { globalFilter: query }, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel() });

  const handleAddProduct = async (product: NewProductInput) => {
    await addProduct(product);
    setDialogOpen(false);
  };

  const runBulk = async (action: "archive" | "delete" | "publish" | "draft") => {
    if (selected.length === 0) return;
    if (action === "delete" && !window.confirm(`${selected.length} ta mahsulot o‘chirilsinmi?`)) return;
    setBulkBusy(true);
    setActionError(null);
    try {
      await bulkProducts(selected, action);
      setSelected([]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Bulk amal bajarilmadi");
    } finally {
      setBulkBusy(false);
    }
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    setActionError(null);
    try {
      const dryRun = await fetch("/api/products/import?mode=upsert&dryRun=true", { method: "POST", headers: { "Content-Type": "text/csv" }, body: file });
      const dryPayload = await dryRun.json();
      if (!dryRun.ok) throw new Error(dryPayload.error?.message ?? "CSV tekshiruvdan o‘tmadi");
      const apply = await fetch("/api/products/import?mode=upsert&dryRun=false", { method: "POST", headers: { "Content-Type": "text/csv" }, body: file });
      const payload = await apply.json();
      if (!apply.ok) throw new Error(payload.error?.message ?? "CSV import qilinmadi");
      await refreshProducts();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "CSV import qilinmadi");
    } finally {
      setImporting(false);
    }
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

        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/25 px-4 py-3 sm:px-5">
          <Link href="/api/products/export?format=csv" className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:bg-muted"><Download className="size-4" />CSV export</Link>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold hover:bg-muted">
            <Upload className="size-4" />{importing ? "Import..." : "CSV import"}
            <input type="file" accept=".csv,text/csv" disabled={importing} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.target.value = ""; }} />
          </label>
          {selected.length > 0 && <div className="ml-auto flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-brand">{selected.length} ta tanlandi</span><button type="button" disabled={bulkBusy} onClick={() => void bulkProducts(selected, "restore").then(() => setSelected([]))} className="h-8 rounded-lg bg-brand/10 px-2.5 text-xs font-semibold text-brand"><ArchiveRestore className="mr-1 inline size-3.5" />Tiklash</button><button type="button" disabled={bulkBusy} onClick={() => void runBulk("publish")} className="h-8 rounded-lg bg-brand/10 px-2.5 text-xs font-semibold text-brand">E’lon qilish</button><button type="button" disabled={bulkBusy} onClick={() => void runBulk("draft")} className="h-8 rounded-lg bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-700">Qoralama</button><button type="button" disabled={bulkBusy} onClick={() => void runBulk("archive")} className="h-8 rounded-lg bg-muted px-2.5 text-xs font-semibold"><Archive className="mr-1 inline size-3.5" />Arxiv</button><button type="button" disabled={bulkBusy} onClick={() => void runBulk("delete")} className="h-8 rounded-lg bg-red-500/10 px-2.5 text-xs font-semibold text-red-700"><Trash2 className="mr-1 inline size-3.5" />O‘chirish</button></div>}
        </div>
        {actionError && <div className="border-b border-red-500/20 bg-red-500/[0.06] px-5 py-3 text-sm text-red-700">{actionError}</div>}

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
                  <div className="flex items-start gap-2"><input type="checkbox" aria-label={`${product.name}ni tanlash`} checked={selected.includes(product.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id))} className="mt-1 size-4 accent-[#10a184]" /><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.sku} · {product.category}</p></div></div>
                  <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-semibold", statusMeta[product.status].className)}>{statusMeta[product.status].label}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Narx</p><p className="mt-1 font-medium">{formatMoney(product.price)} UZS</p></div><div><p className="text-xs text-muted-foreground">Ombor</p><p className="mt-1 font-medium">{product.stock} dona</p></div></div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex items-center gap-1"><Languages className="mr-1 size-4 text-muted-foreground" />{product.languages.map((language) => <span key={language} className="rounded-md bg-muted px-1.5 py-1 text-[10px] font-bold">{language}</span>)}</div>
                  <div className="flex items-center gap-1"><button type="button" onClick={() => setEditing(product)} className="inline-flex size-8 items-center justify-center rounded-lg bg-muted" aria-label="Tahrirlash"><Pencil className="size-3.5" /></button><button type="button" onClick={() => toggleVisibility(product.id)} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-semibold transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{product.visibleOnStorefront ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}{product.visibleOnStorefront ? "Ko‘rinadi" : "Yashirin"}</button></div>
                </div>
              </article>
            );
          })}
        </div>

        {table.getRowModel().rows.length === 0 && <div className="px-5 py-16 text-center"><p className="font-medium">Mahsulot topilmadi</p><p className="mt-1 text-sm text-muted-foreground">Qidiruv yoki filtrni o‘zgartirib ko‘ring.</p></div>}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>{table.getRowModel().rows.length} ta mahsulot ko‘rsatilmoqda</span><span>Persistent API</span></div>
      </div>

      {dialogOpen && <AddProductDialog onClose={() => setDialogOpen(false)} onAdd={handleAddProduct} onUpload={uploadProductImage} />}
      {editing && <EditProductDialog product={editing} onClose={() => setEditing(null)} onSave={async (input) => { await updateProduct(editing.id, input); setEditing(null); }} onUpload={uploadProductImage} />}
    </>
  );
}

type TranslationDraft = Omit<ProductTranslation, "specs"> & { specs: string };

const emptyTranslation = (): TranslationDraft => ({ name: "", description: "", imageAlt: "", badge: "", specs: "", videoTitle: "", videoEyebrow: "" });
const languageNames: Record<ProductLanguage, string> = { UZ: "O‘zbekcha", RU: "Русский", EN: "English" };

function AddProductDialog({ onClose, onAdd, onUpload }: { onClose: () => void; onAdd: (product: NewProductInput) => Promise<void>; onUpload: (file: File, altText: string) => Promise<ProductMediaInput> }) {
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Smartfon");
  const [image, setImage] = useState("");
  const [media, setMedia] = useState<ProductMediaInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [costPrice, setCostPrice] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPosterUrl, setVideoPosterUrl] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [visibleOnStorefront, setVisibleOnStorefront] = useState(false);
  const [languages, setLanguages] = useState<ProductLanguage[]>(["UZ"]);
  const [activeLanguage, setActiveLanguage] = useState<ProductLanguage>("UZ");
  const [translations, setTranslations] = useState<Record<ProductLanguage, TranslationDraft>>({ UZ: emptyTranslation(), RU: emptyTranslation(), EN: emptyTranslation() });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const canSubmit = Boolean(
    sku.trim() && Number(costPrice) > 0 && Number(price) > 0
    && languages.every((locale) => translations[locale].name.trim().length >= 2 && translations[locale].description.trim().length >= 2),
  );
  const expectedProfit = Math.max(0, Number(price) - Number(costPrice));
  const margin = Number(price) > 0 ? Math.round((expectedProfit / Number(price)) * 100) : 0;

  const toggleLanguage = (language: ProductLanguage) => {
    if (language === "UZ") return;
    setLanguages((current) => {
      if (current.includes(language)) {
        setActiveLanguage("UZ");
        return current.filter((item) => item !== language);
      }
      setActiveLanguage(language);
      return [...current, language];
    });
  };
  const updateTranslation = (field: keyof TranslationDraft, value: string) => setTranslations((current) => ({
    ...current,
    [activeLanguage]: { ...current[activeLanguage], [field]: value },
  }));
  const activeTranslation = translations[activeLanguage];

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
            const localizedContent = Object.fromEntries(languages.map((locale) => {
              const content = translations[locale];
              return [locale, {
                ...content,
                name: content.name.trim(),
                description: content.description.trim(),
                imageAlt: content.imageAlt.trim() || content.name.trim(),
                badge: content.badge?.trim() || undefined,
                specs: content.specs.split(/[\n,]/).map((item) => item.trim()).filter(Boolean),
                videoTitle: content.videoTitle?.trim() || undefined,
                videoEyebrow: content.videoEyebrow?.trim() || undefined,
              }];
            })) as Partial<Record<ProductLanguage, ProductTranslation>>;
            const uzContent = localizedContent.UZ!;
            await onAdd({
              name: uzContent.name, sku: sku.trim().toUpperCase(), category,
              costPrice: Number(costPrice), price: Number(price),
              compareAtPrice: Number(compareAtPrice) || undefined,
              description: uzContent.description,
              image: image.trim() || undefined,
              media: media.length > 0 ? media : undefined,
              imageAlt: uzContent.imageAlt,
              videoUrl: videoUrl.trim() || undefined, videoPosterUrl: videoPosterUrl.trim() || undefined,
              stock: Number(stock) || 0, status,
              visibleOnStorefront: status === "published" && visibleOnStorefront,
              languages,
              translations: localizedContent,
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
              <label className="space-y-1.5"><span className="text-sm font-medium">SKU <span className="text-brand">*</span></span><input required value={sku} onChange={(event) => setSku(event.target.value)} placeholder="APL-IP16P-256" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Kategoriya</span><select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)} className="h-11 w-full cursor-pointer rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Mahsulot rasmi URL</span><input value={image} onChange={(event) => setImage(event.target.value)} placeholder="/products/iphone.png yoki https://..." className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label>
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand/40 bg-brand/[0.035] text-sm font-semibold text-brand sm:col-span-2"><Upload className="size-4" />{uploading ? "Rasm yuklanmoqda..." : media.length > 0 ? `${media.length} ta rasm yuklandi` : "Kompyuterdan rasm yuklash"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} className="sr-only" onChange={async (event) => { const files = [...(event.target.files ?? [])]; if (files.length === 0) return; setUploading(true); setSubmitError(null); try { const uploaded = await Promise.all(files.slice(0, 10).map((file, index) => onUpload(file, translations.UZ.imageAlt || translations.UZ.name).then((item) => ({ ...item, position: media.length + index, isPrimary: media.length === 0 && index === 0 })))); setMedia((current) => [...current, ...uploaded]); if (!image && uploaded[0]) setImage(uploaded[0].url); } catch (error) { setSubmitError(error instanceof Error ? error.message : "Rasm yuklanmadi"); } finally { setUploading(false); event.target.value = ""; } }} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-brand/20 bg-brand/[0.035] p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-sm font-semibold">Ko‘p tilli kontent</h3><p className="mt-0.5 text-xs text-muted-foreground">Tanlangan har bir tilning matni product bilan birga DB’ga saqlanadi.</p></div>
              <div className="flex rounded-xl bg-muted p-1">{languages.map((locale) => <button key={locale} type="button" onClick={() => setActiveLanguage(locale)} className={cn("h-8 rounded-lg px-3 text-xs font-semibold", activeLanguage === locale ? "bg-background text-brand shadow-sm" : "text-muted-foreground")}>{locale}</button>)}</div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">{(["UZ", "RU", "EN"] as const).map((locale) => { const active = languages.includes(locale); return <button type="button" key={locale} onClick={() => active ? toggleLanguage(locale) : toggleLanguage(locale)} className={cn("inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold", active ? "border-brand bg-brand/10 text-brand" : "border-border bg-background text-muted-foreground")} aria-pressed={active}>{active && <Check className="size-3.5" />}{languageNames[locale]}{locale === "UZ" && <span className="opacity-60">· asosiy</span>}</button>; })}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nomi ({activeLanguage}) <span className="text-brand">*</span></span><input autoFocus={activeLanguage === "UZ"} required value={activeTranslation.name} onChange={(event) => updateTranslation("name", event.target.value)} placeholder={activeLanguage === "RU" ? "Название товара" : activeLanguage === "EN" ? "Product name" : "Mahsulot nomi"} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Tavsif ({activeLanguage}) <span className="text-brand">*</span></span><textarea required rows={4} value={activeTranslation.description} onChange={(event) => updateTranslation("description", event.target.value)} placeholder="Storefront’da ko‘rinadigan batafsil tavsif" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Rasm alt matni</span><input value={activeTranslation.imageAlt} onChange={(event) => updateTranslation("imageAlt", event.target.value)} placeholder="Rasmni qisqa tasvirlang" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Badge</span><input value={activeTranslation.badge} onChange={(event) => updateTranslation("badge", event.target.value)} placeholder="Yangi / Новинка / New" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Xususiyatlar</span><textarea rows={3} value={activeTranslation.specs} onChange={(event) => updateTranslation("specs", event.target.value)} placeholder="Har birini yangi qatorda yozing:&#10;256GB&#10;A19 Pro&#10;6.3 dyuym" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Video sarlavhasi</span><input value={activeTranslation.videoTitle} onChange={(event) => updateTranslation("videoTitle", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="space-y-1.5"><span className="text-sm font-medium">Video eyebrow</span><input value={activeTranslation.videoEyebrow} onChange={(event) => updateTranslation("videoEyebrow", event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
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

function EditProductDialog({
  product,
  onClose,
  onSave,
  onUpload,
}: {
  product: CommerceProduct;
  onClose: () => void;
  onSave: (input: UpdateProductInput) => Promise<void>;
  onUpload: (file: File, altText: string) => Promise<ProductMediaInput>;
}) {
  const primaryTranslation = product.translations?.UZ ?? {
    name: product.name,
    description: product.description,
    imageAlt: product.imageAlt,
    badge: product.badge,
    specs: product.specs,
  };
  const [name, setName] = useState(primaryTranslation.name);
  const [description, setDescription] = useState(primaryTranslation.description);
  const [sku, setSku] = useState(product.sku);
  const [category, setCategory] = useState<ProductCategory>(product.category);
  const [costPrice, setCostPrice] = useState(String(product.costPrice));
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPrice ? String(product.compareAtPrice) : "");
  const [stock, setStock] = useState(String(product.stock));
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [visible, setVisible] = useState(product.visibleOnStorefront);
  const [media, setMedia] = useState<ProductMediaInput[]>(product.media.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    type: item.type,
    url: item.url,
    mimeType: item.mimeType,
    altText: item.altText,
    width: item.width,
    height: item.height,
    sizeBytes: item.sizeBytes,
    position: item.position,
    isPrimary: item.isPrimary,
  })));
  const [variants, setVariants] = useState<ProductVariantInput[]>(product.variants.map((item) => ({
    id: item.id,
    title: item.title,
    sku: item.sku,
    barcode: item.barcode,
    costPrice: item.costPrice,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    stock: item.stock,
    status: item.status,
    options: item.options,
    position: item.position,
    version: item.version,
  })));
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateVariant = (index: number, patch: Partial<ProductVariantInput>) => setVariants((current) => current.map((variant, position) => position === index ? { ...variant, ...patch } : variant));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Tahrirlash oynasini yopish" />
      <form onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError(null);
        try {
          const translation = {
            ...primaryTranslation,
            name: name.trim(),
            description: description.trim(),
            imageAlt: primaryTranslation.imageAlt || name.trim(),
            specs: primaryTranslation.specs ?? [],
          };
          const primaryImage = media.find((item) => item.isPrimary && item.type === "image") ?? media.find((item) => item.type === "image");
          await onSave({
            version: product.version,
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            category,
            costPrice: Number(costPrice),
            price: Number(price),
            compareAtPrice: Number(compareAtPrice) || undefined,
            stock: variants.length === 0 ? Number(stock) : undefined,
            status,
            visibleOnStorefront: status === "published" && visible,
            image: primaryImage?.url ?? product.image,
            translations: { ...product.translations, UZ: translation },
            languages: product.languages,
            variants,
            media,
          });
        } catch (error) {
          setFormError(error instanceof Error ? error.message : "Mahsulot saqlanmadi");
        } finally {
          setSubmitting(false);
        }
      }} className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-background shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur-xl"><div><p className="text-xs font-semibold text-brand">Versiya {product.version}</p><h2 id="edit-product-title" className="mt-1 text-xl font-semibold">Mahsulotni tahrirlash</h2></div><button type="button" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-xl bg-muted"><X className="size-4" /></button></div>
        <div className="space-y-6 p-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nomi</span><input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="h-11 w-full rounded-xl border border-input px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">SKU</span><input required value={sku} onChange={(event) => setSku(event.target.value)} className="h-11 w-full rounded-xl border border-input px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="space-y-1.5"><span className="text-sm font-medium">Kategoriya</span><select value={category} onChange={(event) => setCategory(event.target.value as ProductCategory)} className="h-11 w-full rounded-xl border border-input px-3 text-sm">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Tavsif</span><textarea required minLength={2} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-xl border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
          </section>

          <section className="rounded-2xl border border-border p-4"><h3 className="text-sm font-semibold">Narx va holat</h3><div className="mt-3 grid gap-4 sm:grid-cols-3"><label className="space-y-1.5"><span className="text-xs text-muted-foreground">Kirim narxi</span><input type="number" min="0" value={costPrice} onChange={(event) => setCostPrice(event.target.value)} className="h-10 w-full rounded-xl border border-input px-3 text-sm" /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">Sotuv narxi</span><input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} className="h-10 w-full rounded-xl border border-input px-3 text-sm" /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">Eski narx</span><input type="number" min="1" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} className="h-10 w-full rounded-xl border border-input px-3 text-sm" /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">Qoldiq</span><input type="number" min="0" disabled={variants.length > 0} value={variants.length > 0 ? variants.reduce((sum, item) => sum + item.stock, 0) : stock} onChange={(event) => setStock(event.target.value)} className="h-10 w-full rounded-xl border border-input px-3 text-sm disabled:opacity-50" /></label><label className="space-y-1.5"><span className="text-xs text-muted-foreground">Holat</span><select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)} className="h-10 w-full rounded-xl border border-input px-3 text-sm"><option value="draft">Qoralama</option><option value="published">Sotuvda</option><option value="archived">Arxiv</option></select></label><label className="flex items-end"><span className="flex h-10 w-full items-center justify-between rounded-xl border border-input px-3 text-sm">Storefront <input type="checkbox" checked={visible && status === "published"} disabled={status !== "published"} onChange={(event) => setVisible(event.target.checked)} className="size-4 accent-[#10a184]" /></span></label></div></section>

          <section className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Rasmlar</h3><p className="mt-1 text-xs text-muted-foreground">Birinchi tanlangan rasm storefront uchun asosiy bo‘ladi.</p></div><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-brand px-3 text-xs font-semibold text-white"><Upload className="size-4" />{uploading ? "Yuklanmoqda" : "Rasm qo‘shish"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} className="sr-only" onChange={async (event) => { const files = [...(event.target.files ?? [])]; setUploading(true); setFormError(null); try { const uploaded = await Promise.all(files.slice(0, 10).map((file, index) => onUpload(file, name).then((item) => ({ ...item, position: media.length + index, isPrimary: media.length === 0 && index === 0 })))); setMedia((current) => [...current, ...uploaded]); } catch (error) { setFormError(error instanceof Error ? error.message : "Rasm yuklanmadi"); } finally { setUploading(false); event.target.value = ""; } }} /></label></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{media.map((item, index) => <div key={item.id ?? `${item.url}-${index}`} className="flex items-center gap-2 rounded-xl bg-muted p-2"><button type="button" onClick={() => setMedia((current) => current.map((mediaItem, position) => ({ ...mediaItem, isPrimary: position === index })))} className={cn("size-6 rounded-full border text-xs", item.isPrimary ? "border-brand bg-brand text-white" : "border-border")}>{item.isPrimary ? "✓" : ""}</button><span className="min-w-0 flex-1 truncate text-xs">{item.url}</span><button type="button" onClick={() => setMedia((current) => current.filter((_, position) => position !== index))} className="inline-flex size-7 items-center justify-center rounded-lg text-red-600"><X className="size-3.5" /></button></div>)}</div></section>

          <section className="rounded-2xl border border-border p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Variantlar</h3><p className="mt-1 text-xs text-muted-foreground">Masalan: rang, xotira yoki o‘lcham.</p></div><button type="button" onClick={() => setVariants((current) => [...current, { title: "", sku: `${sku}-`, costPrice: Number(costPrice) || 0, price: Number(price) || 1, stock: 0, status: "active", options: {}, position: current.length }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand/10 px-3 text-xs font-semibold text-brand"><Plus className="size-4" />Variant</button></div><div className="mt-3 space-y-3">{variants.map((variant, index) => <div key={variant.id ?? index} className="grid gap-2 rounded-xl bg-muted/60 p-3 sm:grid-cols-[1fr_1fr_.7fr_.7fr_.7fr_auto]"><input required placeholder="Nomi" value={variant.title} onChange={(event) => updateVariant(index, { title: event.target.value })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" /><input required placeholder="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs uppercase" /><input type="number" min="0" aria-label="Kirim narxi" value={variant.costPrice} onChange={(event) => updateVariant(index, { costPrice: Number(event.target.value) })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" /><input type="number" min="1" aria-label="Narx" value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" /><input type="number" min="0" aria-label="Qoldiq" value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} className="h-9 rounded-lg border border-input bg-background px-2 text-xs" /><button type="button" onClick={() => setVariants((current) => current.filter((_, position) => position !== index))} className="inline-flex size-9 items-center justify-center rounded-lg text-red-600"><Trash2 className="size-4" /></button></div>)}</div></section>
        </div>
        {formError && <div className="mx-5 mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700">{formError}</div>}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-xl"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">Bekor qilish</button><button type="submit" disabled={submitting || uploading} className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}</button></div>
      </form>
    </div>
  );
}
