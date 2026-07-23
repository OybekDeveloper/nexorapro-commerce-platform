"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Star } from "lucide-react";

import { ProductPurchase } from "@/components/storefront/product-purchase";
import { ProductVideoShowcase } from "@/components/storefront/product-video-showcase";
import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import type { StoreProduct } from "@/lib/storefront-data";

const copy = {
  UZ: { catalog: "Katalog", reviews: "ta sharh", verified: "Tekshirilgan va kafolatli", verifiedText: "Mahsulot topshirishdan oldin diagnostikadan o‘tkaziladi.", specs: ["Konfiguratsiya", "Platforma", "Asosiy imkoniyat", "Format"], feature: "Xususiyat" },
  RU: { catalog: "Каталог", reviews: "отзывов", verified: "Проверено и с гарантией", verifiedText: "Перед передачей товар проходит полную диагностику.", specs: ["Конфигурация", "Платформа", "Главная возможность", "Формат"], feature: "Характеристика" },
  EN: { catalog: "Catalog", reviews: "reviews", verified: "Verified and guaranteed", verifiedText: "Every product is fully inspected before handoff.", specs: ["Configuration", "Platform", "Key feature", "Format"], feature: "Feature" },
} satisfies Record<StoreLocale, { catalog: string; reviews: string; verified: string; verifiedText: string; specs: string[]; feature: string }>;

export function ProductDetails({ initialProduct }: { initialProduct: StoreProduct }) {
  const { locale, products } = useStore();
  const product = products.find((item) => item.id === initialProduct.id) ?? initialProduct;
  const labels = copy[locale];

  return (
    <>
      <main id="main-content" className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav data-motion-reveal className="flex items-center gap-1 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link prefetch={false} href="/catalog" className="cursor-pointer hover:text-brand">{labels.catalog}</Link>
            <ChevronRight className="size-4" />
            <Link prefetch={false} href={`/catalog?category=${product.category}`} className="cursor-pointer hover:text-brand">{product.category}</Link>
            <ChevronRight className="size-4" />
            <span className="truncate text-zinc-700">{product.name}</span>
          </nav>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_430px]">
            <section>
              <div data-shared-product-target={product.slug} className="relative aspect-[1.55/1] overflow-hidden rounded-[2rem] bg-white">
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  priority
                  fetchPriority="high"
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  quality={78}
                  className="object-cover"
                />
                {product.badge && <span className="absolute left-5 top-5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md">{product.badge}</span>}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.specs.map((spec, index) => <div key={`${spec}-${index}`} data-motion-card className="rounded-2xl bg-white p-4"><p className="text-xs uppercase tracking-[0.13em] text-zinc-500">{labels.specs[index] ?? labels.feature}</p><p className="mt-2 font-semibold">{spec}</p></div>)}
              </div>
            </section>
            <aside data-motion-hero>
              <p data-motion-hero-item className="text-sm font-semibold text-brand">{product.category}</p>
              <h1 data-motion-hero-item className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{product.name}</h1>
              <div data-motion-hero-item className="mt-4 flex items-center gap-2 text-sm text-zinc-600"><Star className="size-4 fill-brand text-brand" /><strong className="text-[#1d1d1f]">{product.rating}</strong><span>{product.reviews} {labels.reviews}</span></div>
              <p data-motion-hero-item className="mt-5 text-base leading-7 text-zinc-600">{product.description}</p>
              <div data-motion-hero-item className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand/[0.05] p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><p className="text-sm font-semibold">{labels.verified}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{labels.verifiedText}</p></div></div>
              <div data-motion-hero-item className="mt-6"><ProductPurchase product={product} /></div>
            </aside>
          </div>
        </div>
      </main>
      {product.video && <ProductVideoShowcase media={product.video} productName={product.name} />}
    </>
  );
}
