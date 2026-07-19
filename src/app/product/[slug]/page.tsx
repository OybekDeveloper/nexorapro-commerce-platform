import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Star } from "lucide-react";

import { ProductPurchase } from "@/components/storefront/product-purchase";
import { ProductVideoShowcase } from "@/components/storefront/product-video-showcase";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { storefrontProducts } from "@/lib/storefront-data";
import { getProduct } from "@/server/commerce-repository";

export function generateStaticParams() { return storefrontProducts.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product ? { title: product.name, description: product.description } : { title: "Mahsulot topilmadi" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product || !product.visibleOnStorefront || product.status !== "published") notFound();
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader />
      <main id="main-content" className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav data-motion-reveal className="flex items-center gap-1 text-sm text-zinc-500" aria-label="Breadcrumb">
            <Link href="/catalog" className="cursor-pointer hover:text-brand">Katalog</Link>
            <ChevronRight className="size-4" />
            <Link href={`/catalog?category=${product.category}`} className="cursor-pointer hover:text-brand">{product.category}</Link>
            <ChevronRight className="size-4" />
            <span className="truncate text-zinc-700">{product.name}</span>
          </nav>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_430px]">
            <section>
              <div data-shared-product-target={product.slug} className="relative aspect-[1.55/1] overflow-hidden rounded-[2rem] bg-white">
                <Image src={product.image} alt={product.imageAlt} fill fetchPriority="high" loading="eager" sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover" />
                {product.badge && <span className="absolute left-5 top-5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md">{product.badge}</span>}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.specs.map((spec, index) => (
                  <div key={spec} data-motion-card className="rounded-2xl bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.13em] text-zinc-500">{["Konfiguratsiya", "Platforma", "Asosiy imkoniyat", "Format"][index] ?? "Xususiyat"}</p>
                    <p className="mt-2 font-semibold">{spec}</p>
                  </div>
                ))}
              </div>
            </section>
            <aside data-motion-hero>
              <p data-motion-hero-item className="text-sm font-semibold text-brand">{product.category}</p>
              <h1 data-motion-hero-item className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{product.name}</h1>
              <div data-motion-hero-item className="mt-4 flex items-center gap-2 text-sm text-zinc-600"><Star className="size-4 fill-brand text-brand" /><strong className="text-[#1d1d1f]">{product.rating}</strong><span>{product.reviews} ta sharh</span></div>
              <p data-motion-hero-item className="mt-5 text-base leading-7 text-zinc-600">{product.description}</p>
              <div data-motion-hero-item className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand/[0.05] p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
                <div><p className="text-sm font-semibold">Tekshirilgan va kafolatli</p><p className="mt-1 text-xs leading-5 text-zinc-500">Mahsulot topshirishdan oldin diagnostikadan o‘tkaziladi.</p></div>
              </div>
              <div data-motion-hero-item className="mt-6"><ProductPurchase product={product} /></div>
            </aside>
          </div>
        </div>
      </main>
      {product.video && <ProductVideoShowcase media={product.video} productName={product.name} />}
      <StoreFooter />
    </div>
  );
}
