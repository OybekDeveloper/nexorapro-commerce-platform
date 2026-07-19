import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { NexoraIcon, type NexoraIconName } from "@/components/icons/nexora-icons";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductVideoShowcase } from "@/components/storefront/product-video-showcase";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { storeCategories } from "@/lib/storefront-data";
import { listProducts } from "@/server/commerce-repository";

export default function Home() {
  const products = listProducts({ storefrontOnly: true });
  const videoProduct = products.find((product) => product.video);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader />

      <main id="main-content">
        <section data-motion-hero className="relative overflow-hidden bg-[#07110f] px-4 pb-12 pt-16 text-white sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_50%_-10%,rgba(16,161,132,0.42),transparent_58%)]" />
          <div className="relative mx-auto max-w-7xl text-center">
            <div data-motion-hero-item className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-medium text-[#c8fff4] backdrop-blur-xl">
              <Sparkles className="size-3.5" />
              2026 premium kolleksiya
            </div>
            <h1 data-motion-hero-item className="mx-auto max-w-4xl text-balance text-5xl font-semibold tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              Eng yangi texnologiya. Haqiqiy tajriba.
            </h1>
            <p data-motion-hero-item className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">
              Original smartfonlar, noutbuklar va aksessuarlar. Shaffof narx, ishonchli kafolat va tezkor yetkazib berish.
            </p>
            <div data-motion-hero-item className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/catalog" className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(16,161,132,0.3)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                Xaridni boshlash <ArrowRight className="size-4" />
              </Link>
              <Link href="/admin" className="inline-flex h-11 cursor-pointer items-center justify-center gap-1 rounded-full px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Admin preview <ChevronRight className="size-4" />
              </Link>
            </div>
            <div data-motion-hero-media data-motion-banner className="relative mx-auto mt-12 h-[300px] max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:h-[400px] lg:h-[460px]">
              <Image
                src="/products/iphone-17-pro.png"
                alt="Cosmic Orange rangidagi iPhone 17 Pro kamera tizimi"
                fill
                fetchPriority="high"
                loading="eager"
                sizes="(max-width: 1280px) 100vw, 1152px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/10" />
              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl sm:left-8 sm:top-8 sm:p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Premium service</p><p className="mt-1 text-sm font-semibold">Original va kafolatli</p></div>
              <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl sm:bottom-8 sm:right-8 sm:p-4"><p className="text-2xl font-semibold text-[#55d8c0]">0%</p><p className="mt-1 text-xs text-zinc-400">12 oygacha muddatli to‘lov</p></div>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div data-motion-reveal className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">Yangi kolleksiya</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Eng ko‘p tanlanayotganlar.</h2>
            </div>
            <Link href="/catalog" className="hidden cursor-pointer items-center gap-1 text-sm font-semibold text-brand hover:opacity-75 sm:flex">
              Barchasini ko‘rish <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {products.filter((product) => product.featured).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>

        {videoProduct?.video && <ProductVideoShowcase media={videoProduct.video} productName={videoProduct.name} />}

        <section id="categories" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="grid gap-4 lg:grid-cols-3">
            {storeCategories.slice(0, 3).map((category) => (
              <Link key={category.value} href={`/catalog?category=${category.value}`} data-motion-card className="group relative min-h-80 cursor-pointer overflow-hidden rounded-[1.75rem] bg-[#0c1a17] p-7 text-white shadow-sm transition-shadow hover:shadow-[0_18px_55px_rgba(16,161,132,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                <div className="relative z-10">
                  <p className="text-sm text-zinc-400">Kolleksiya</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">{category.label}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{category.description}</p>
                </div>
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-center opacity-80 transition-[transform,opacity] duration-300 group-hover:scale-[1.025] group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#07110f]/90 via-[#07110f]/30 to-transparent" />
              </Link>
            ))}
          </div>
        </section>

        <section id="why-us" className="border-y border-black/5 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8">
            {([
              ["Rasmiy kafolat", "Har bir mahsulot tekshiriladi va kafolat bilan beriladi.", "check"],
              ["Tez yetkazib berish", "Toshkent bo‘ylab shu kunning o‘zida yetkazish imkoniyati.", "order"],
              ["Moslashuvchan to‘lov", "Naqd, karta va bo‘lib to‘lash variantlari.", "wallet"],
            ] as Array<[string, string, NexoraIconName]>).map(([title, text, icon]) => (
              <div key={title} data-motion-reveal className="flex gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><NexoraIcon name={icon} className="size-5" /></span>
                <div><h3 className="font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
