import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Globe2,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { ProductArt } from "@/components/product-art";
import { NexoraIcon, NexoraMark, type NexoraIconName } from "@/components/icons/nexora-icons";
import { featuredProducts } from "@/lib/mock-data";

const categories = [
  { name: "Smartfonlar", description: "Eng yangi premium modellar", kind: "phone" as const },
  { name: "Noutbuklar", description: "Ish va ijod uchun kuch", kind: "laptop" as const },
  { name: "Audio", description: "Toza va chuqur ovoz", kind: "audio" as const },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-black px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Asosiy kontentga o‘tish
      </a>

      <div className="bg-brand px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">Toshkent bo‘ylab 24 soat ichida yetkazib berish</div>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex cursor-pointer items-center gap-2 text-lg font-semibold tracking-[-0.04em]">
            <NexoraMark className="size-7 text-brand" />
            <span>nexorapro<span className="text-brand">.dev</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex" aria-label="Asosiy navigatsiya">
            <a href="#products" className="cursor-pointer transition-colors hover:text-black">Mahsulotlar</a>
            <a href="#categories" className="cursor-pointer transition-colors hover:text-black">Kategoriyalar</a>
            <a href="#why-us" className="cursor-pointer transition-colors hover:text-black">Nega biz?</a>
          </nav>
          <div className="flex items-center gap-1">
            <button className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black" aria-label="Tilni tanlash">
              <Globe2 className="size-[18px]" />
            </button>
            <button className="hidden size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black sm:inline-flex" aria-label="Qidirish">
              <Search className="size-[18px]" />
            </button>
            <button className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black" aria-label="Savat">
              <ShoppingBag className="size-[18px]" />
            </button>
            <button className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black md:hidden" aria-label="Menyuni ochish">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden bg-[#07110f] px-4 pb-12 pt-16 text-white sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_50%_-10%,rgba(16,161,132,0.42),transparent_58%)]" />
          <div className="relative mx-auto max-w-7xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-medium text-[#c8fff4] backdrop-blur-xl">
              <Sparkles className="size-3.5" />
              Premium texnologiya. Bir joyda.
            </div>
            <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              Kelajak siz o‘ylagandan ham yaqin.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-zinc-400 sm:text-lg">
              Original smartfonlar, noutbuklar va aksessuarlar. Shaffof narx, ishonchli kafolat va tezkor yetkazib berish.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#products" className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(16,161,132,0.3)] transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                Xaridni boshlash <ArrowRight className="size-4" />
              </a>
              <Link href="/admin" className="inline-flex h-11 cursor-pointer items-center justify-center gap-1 rounded-full px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Admin preview <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="relative mx-auto mt-12 flex h-[300px] max-w-5xl items-end justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(16,161,132,0.22),transparent_35%),linear-gradient(145deg,#162c27,#040706_62%)] shadow-[0_30px_90px_rgba(0,0,0,0.35)] sm:h-[400px] lg:h-[460px]">
              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl sm:left-8 sm:top-8 sm:p-4"><p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Premium service</p><p className="mt-1 text-sm font-semibold">Original va kafolatli</p></div>
              <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-white/10 p-3 text-left backdrop-blur-xl sm:bottom-8 sm:right-8 sm:p-4"><p className="text-2xl font-semibold text-[#55d8c0]">0%</p><p className="mt-1 text-xs text-zinc-400">12 oygacha muddatli to‘lov</p></div>
              <div className="translate-y-16 scale-[1.35] sm:translate-y-20 sm:scale-[1.7] lg:scale-[2]">
                <ProductArt kind="phone" tone="teal" />
              </div>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand">Yangi kolleksiya</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Eng ko‘p tanlanayotganlar.</h2>
            </div>
            <a href="#categories" className="hidden cursor-pointer items-center gap-1 text-sm font-semibold text-brand hover:opacity-75 sm:flex">
              Barchasini ko‘rish <ChevronRight className="size-4" />
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product, index) => (
              <article key={product.id} className={`group overflow-hidden rounded-[1.75rem] border border-black/[0.04] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-200 hover:border-brand/20 hover:shadow-[0_18px_55px_rgba(16,161,132,0.1)] ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}>
                <div className="mb-6 flex h-64 items-center justify-center overflow-hidden rounded-3xl bg-[#f5f5f7]">
                  <ProductArt kind={product.art} tone={product.tone} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{product.category}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{product.name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{product.subtitle}</p>
                  </div>
                  <button className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" aria-label={`${product.name}ni savatga qo‘shish`}>
                    <ShoppingBag className="size-4" />
                  </button>
                </div>
                <p className="mt-5 text-sm font-semibold text-brand">{product.price}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="grid gap-4 lg:grid-cols-3">
            {categories.map((category) => (
              <a key={category.name} href="#products" className="group relative min-h-80 cursor-pointer overflow-hidden rounded-[1.75rem] bg-[#0c1a17] p-7 text-white shadow-sm transition-shadow hover:shadow-[0_18px_55px_rgba(16,161,132,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                <div className="relative z-10">
                  <p className="text-sm text-zinc-400">Kolleksiya</p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">{category.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{category.description}</p>
                </div>
                <div className="absolute -bottom-14 -right-8 transition-transform duration-300 group-hover:-translate-y-2">
                  <ProductArt kind={category.kind} tone="silver" />
                </div>
              </a>
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
              <div key={title} className="flex gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand"><NexoraIcon name={icon} className="size-5" /></span>
                <div><h3 className="font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#f5f5f7] px-4 py-10 text-sm text-zinc-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 nexorapro.dev Commerce. Portfolio demo.</p>
          <div className="flex gap-5"><span>UZ</span><span>RU</span><span>EN</span></div>
        </div>
      </footer>
    </div>
  );
}
