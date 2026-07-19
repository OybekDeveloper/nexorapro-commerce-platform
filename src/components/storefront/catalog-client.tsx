"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { ProductCard } from "@/components/storefront/product-card";
import { useStore } from "@/components/storefront/store-provider";
import { storeCategories, type StoreCategory } from "@/lib/storefront-data";
import { cn } from "@/lib/utils";

type SortValue = "featured" | "price-asc" | "price-desc" | "rating";

export function CatalogClient({
  initialCategory,
  initialQuery,
}: {
  initialCategory?: string;
  initialQuery?: string;
}) {
  const { products } = useStore();
  const validCategory = storeCategories.some(
    (item) => item.value === initialCategory,
  )
    ? (initialCategory as StoreCategory)
    : "all";
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState<"all" | StoreCategory>(
    validCategory,
  );
  const [sort, setSort] = useState<SortValue>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    const items = products.filter((product) => {
      const matchesQuery =
        `${product.name} ${product.category} ${product.description} ${product.specs.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesStock = !inStockOnly || product.stock > 0;
      return matchesQuery && matchesCategory && matchesStock;
    });
    return [...items].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return Number(b.featured) - Number(a.featured);
    });
  }, [category, inStockOnly, products, query, sort]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("featured");
    setInStockOnly(false);
  };

  const filters = (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-sm font-semibold text-[#1d1d1f]">
          Kategoriya
        </legend>
        <div className="mt-3 space-y-1">
          {[
            {
              value: "all" as const,
              label: "Barcha mahsulotlar",
              count: products.length,
            },
            ...storeCategories.map((item) => ({
              value: item.value,
              label: item.label,
              count: products.filter(
                (product) => product.category === item.value,
              ).length,
            })),
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              className={cn(
                "flex h-11 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                category === item.value && "bg-brand/10 text-brand",
              )}
            >
              <span className="inline-flex items-center gap-2">
                {category === item.value && <Check className="size-4" />}
                {item.label}
              </span>
              <span className="text-xs text-zinc-400">{item.count}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-[#1d1d1f]">
          Mavjudlik
        </legend>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-black/10 px-3 py-3 text-sm">
          <span>
            <span className="block font-medium">Faqat mavjudlari</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Omborda bor mahsulotlar
            </span>
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="size-5 cursor-pointer accent-[#10a184]"
          />
        </label>
      </fieldset>
      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/10 text-sm font-semibold transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <X className="size-4" />
        Filtrlarni tozalash
      </button>
    </div>
  );

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#f5f5f7] px-4 py-10 text-[#1d1d1f] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div data-motion-hero className="max-w-3xl">
          <p data-motion-hero-item className="text-sm font-semibold text-brand">
            nexorapro.dev Catalog
          </p>
          <h1
            data-motion-hero-item
            className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl"
          >
            O‘zingizga mos texnologiyani tanlang.
          </h1>
          <p
            data-motion-hero-item
            className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg"
          >
            Real product rasmlari, tushunarli xususiyatlar va API-backed
            checkout’gacha ishlaydigan commerce tajribasi.
          </p>
        </div>

        <section
          id="categories"
          className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Kategoriyalar"
        >
          {storeCategories.map((item) => (
            <button
              key={item.value}
              type="button"
              data-motion-card
              onClick={() => setCategory(item.value)}
              className={cn(
                "cursor-pointer rounded-2xl border bg-white p-4 text-left transition-[border-color,box-shadow] hover:border-brand/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                category === item.value
                  ? "border-brand shadow-[0_10px_30px_rgba(16,161,132,0.1)]"
                  : "border-black/5",
              )}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {item.description}
              </p>
            </button>
          ))}
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside
            data-motion-reveal
            className="hidden h-fit rounded-2xl border border-black/5 bg-white p-4 lg:block lg:sticky lg:top-24"
          >
            <div className="mb-5 flex items-center gap-2 border-b border-black/5 pb-4">
              <SlidersHorizontal className="size-4 text-brand" />
              <h2 className="font-semibold">Filtrlar</h2>
            </div>
            {filters}
          </aside>
          <section className="min-w-0">
            <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <label htmlFor="catalog-search" className="sr-only">
                  Katalogdan qidirish
                </label>
                <input
                  id="catalog-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Mahsulot, kategoriya yoki xususiyat..."
                  className="h-11 w-full rounded-xl bg-zinc-100 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-brand"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFilters(true)}
                  className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/10 px-3 text-sm font-semibold lg:hidden"
                >
                  <Filter className="size-4" />
                  Filtr
                </button>
                <div className="relative flex-1 sm:flex-none">
                  <label htmlFor="catalog-sort" className="sr-only">
                    Saralash
                  </label>
                  <select
                    id="catalog-sort"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as SortValue)
                    }
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-black/10 bg-white pl-3 pr-9 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="featured">Tavsiya etilgan</option>
                    <option value="price-asc">Narx: arzonidan</option>
                    <option value="price-desc">Narx: qimmatidan</option>
                    <option value="rating">Reyting bo‘yicha</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>
            </div>
            <div className="my-5 flex items-center justify-between">
              <p className="text-sm text-zinc-600">
                <strong className="text-[#1d1d1f]">
                  {filteredProducts.length}
                </strong>{" "}
                ta mahsulot
              </p>
              {(query || category !== "all" || inStockOnly) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cursor-pointer text-sm font-semibold text-brand hover:opacity-75"
                >
                  Tozalash
                </button>
              )}
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-white px-5 py-20 text-center">
                <Search className="mx-auto size-8 text-brand" />
                <h2 className="mt-4 text-xl font-semibold">
                  Mahsulot topilmadi
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Qidiruv so‘zi yoki filtrlarni o‘zgartirib ko‘ring.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 h-10 cursor-pointer rounded-full bg-brand px-5 text-sm font-semibold text-white"
                >
                  Barcha mahsulotlar
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileFilters(false)}
            aria-label="Filtrni yopish"
          />
          <aside className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtrlar</h2>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-zinc-100"
                aria-label="Filtrni yopish"
              >
                <X className="size-5" />
              </button>
            </div>
            {filters}
            <button
              type="button"
              onClick={() => setMobileFilters(false)}
              className="mt-5 h-12 w-full cursor-pointer rounded-xl bg-brand text-sm font-semibold text-white"
            >
              {filteredProducts.length} ta natijani ko‘rish
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
