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
import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import { storeCategories, type StoreCategory } from "@/lib/storefront-data";
import { cn } from "@/lib/utils";

type SortValue = "featured" | "price-asc" | "price-desc" | "rating";

const copy = {
  UZ: { eyebrow: "nexorapro.dev katalogi", title: "O‘zingizga mos texnologiyani tanlang.", intro: "Haqiqiy mahsulot rasmlari, tushunarli xususiyatlar va API bilan ishlaydigan xarid tajribasi.", category: "Kategoriya", all: "Barcha mahsulotlar", availability: "Mavjudlik", inStock: "Faqat mavjudlari", inStockHint: "Omborda bor mahsulotlar", clearFilters: "Filtrlarni tozalash", filters: "Filtrlar", search: "Mahsulot, kategoriya yoki xususiyat...", filter: "Filtr", featured: "Tavsiya etilgan", low: "Narx: arzonidan", high: "Narx: qimmatidan", rating: "Reyting bo‘yicha", products: "ta mahsulot", clear: "Tozalash", notFound: "Mahsulot topilmadi", notFoundHint: "Qidiruv so‘zi yoki filtrlarni o‘zgartirib ko‘ring.", results: "ta natijani ko‘rish" },
  RU: { eyebrow: "Каталог nexorapro.dev", title: "Выберите подходящую технологию.", intro: "Реальные изображения, понятные характеристики и покупки через API.", category: "Категория", all: "Все товары", availability: "Наличие", inStock: "Только в наличии", inStockHint: "Товары, доступные на складе", clearFilters: "Сбросить фильтры", filters: "Фильтры", search: "Товар, категория или характеристика...", filter: "Фильтр", featured: "Рекомендуемые", low: "Цена: по возрастанию", high: "Цена: по убыванию", rating: "По рейтингу", products: "товаров", clear: "Сбросить", notFound: "Товары не найдены", notFoundHint: "Измените поисковый запрос или фильтры.", results: "результатов" },
  EN: { eyebrow: "nexorapro.dev Catalog", title: "Choose the technology that fits you.", intro: "Real product images, clear specifications, and an API-powered shopping experience.", category: "Category", all: "All products", availability: "Availability", inStock: "In stock only", inStockHint: "Products currently in stock", clearFilters: "Clear filters", filters: "Filters", search: "Product, category, or feature...", filter: "Filter", featured: "Featured", low: "Price: low to high", high: "Price: high to low", rating: "By rating", products: "products", clear: "Clear", notFound: "No products found", notFoundHint: "Try changing your search or filters.", results: "results" },
} satisfies Record<StoreLocale, Record<string, string>>;

export const categoryCopy: Record<StoreLocale, Record<StoreCategory, { label: string; description: string }>> = {
  UZ: { Smartfon: { label: "Smartfonlar", description: "Eng yangi Pro modellar" }, Noutbuk: { label: "Noutbuklar", description: "Ish va ijod uchun kuch" }, Planshet: { label: "Planshetlar", description: "Yengil va professional" }, Audio: { label: "Audio", description: "Tiniq va chuqur ovoz" }, Aksessuar: { label: "Aksessuarlar", description: "Qulay kundalik qo‘shimchalar" } },
  RU: { Smartfon: { label: "Смартфоны", description: "Новейшие Pro-модели" }, Noutbuk: { label: "Ноутбуки", description: "Мощность для работы и творчества" }, Planshet: { label: "Планшеты", description: "Лёгкие и профессиональные" }, Audio: { label: "Аудио", description: "Чистый и глубокий звук" }, Aksessuar: { label: "Аксессуары", description: "Удобные дополнения на каждый день" } },
  EN: { Smartfon: { label: "Smartphones", description: "The latest Pro models" }, Noutbuk: { label: "Laptops", description: "Power for work and creativity" }, Planshet: { label: "Tablets", description: "Light and professional" }, Audio: { label: "Audio", description: "Clear, immersive sound" }, Aksessuar: { label: "Accessories", description: "Useful everyday additions" } },
};

export function CatalogClient({
  initialCategory,
  initialQuery,
}: {
  initialCategory?: string;
  initialQuery?: string;
}) {
  const { products, locale } = useStore();
  const labels = copy[locale];
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
          {labels.category}
        </legend>
        <div className="mt-3 space-y-1">
          {[
            {
              value: "all" as const,
              label: labels.all,
              count: products.length,
            },
            ...storeCategories.map((item) => ({
              value: item.value,
              label: categoryCopy[locale][item.value].label,
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
          {labels.availability}
        </legend>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-black/10 px-3 py-3 text-sm">
          <span>
            <span className="block font-medium">{labels.inStock}</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              {labels.inStockHint}
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
        {labels.clearFilters}
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
            {labels.eyebrow}
          </p>
          <h1
            data-motion-hero-item
            className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl"
          >
            {labels.title}
          </h1>
          <p
            data-motion-hero-item
            className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg"
          >
            {labels.intro}
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
              <p className="font-semibold">{categoryCopy[locale][item.value].label}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {categoryCopy[locale][item.value].description}
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
              <h2 className="font-semibold">{labels.filters}</h2>
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
                  placeholder={labels.search}
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
                  {labels.filter}
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
                    <option value="featured">{labels.featured}</option>
                    <option value="price-asc">{labels.low}</option>
                    <option value="price-desc">{labels.high}</option>
                    <option value="rating">{labels.rating}</option>
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
                {labels.products}
              </p>
              {(query || category !== "all" || inStockOnly) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="cursor-pointer text-sm font-semibold text-brand hover:opacity-75"
                >
                  {labels.clear}
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
                  {labels.notFound}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  {labels.notFoundHint}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 h-10 cursor-pointer rounded-full bg-brand px-5 text-sm font-semibold text-white"
                >
                  {labels.all}
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
              <h2 className="text-lg font-semibold">{labels.filters}</h2>
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
              {filteredProducts.length} {labels.results}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
