"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Globe2, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";

import { NexoraMark } from "@/components/icons/nexora-icons";
import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import { canUseStoreMotion, CART_ADDED_EVENT, loadGsap, prefersCompactMotion } from "@/lib/storefront-motion";
import { cn } from "@/lib/utils";

const copy = {
  UZ: { announcement: "Toshkent bo‘ylab 24 soat ichida yetkazib berish", catalog: "Katalog", categories: "Kategoriyalar", benefits: "Afzalliklar", admin: "Admin", search: "Mahsulot qidirish", placeholder: "iPhone, MacBook yoki AirPods...", all: "Barcha natijalar", menu: "Menyu", skip: "Asosiy kontentga o‘tish", cart: "Savat", login: "Email orqali kirish", closeSearch: "Qidiruvni yopish", quick: "Tezkor qidiruv", quickHint: "Kamida 2 ta harf kiriting yoki katalogni oching.", empty: "Mahsulot topilmadi", emptyHint: "Boshqa nom yoki kategoriya bilan qidiring.", closeMenu: "Menyuni yopish", open: "ochish", searchVerb: "qidirish", close: "yopish" },
  RU: { announcement: "Доставка по Ташкенту в течение 24 часов", catalog: "Каталог", categories: "Категории", benefits: "Преимущества", admin: "Админ", search: "Поиск товаров", placeholder: "iPhone, MacBook или AirPods...", all: "Все результаты", menu: "Меню", skip: "Перейти к основному содержанию", cart: "Корзина", login: "Войти по email", closeSearch: "Закрыть поиск", quick: "Быстрый поиск", quickHint: "Введите минимум 2 символа или откройте каталог.", empty: "Товары не найдены", emptyHint: "Попробуйте другое название или категорию.", closeMenu: "Закрыть меню", open: "открыть", searchVerb: "поиск", close: "закрыть" },
  EN: { announcement: "Delivery across Tashkent within 24 hours", catalog: "Catalog", categories: "Categories", benefits: "Benefits", admin: "Admin", search: "Search products", placeholder: "iPhone, MacBook or AirPods...", all: "View all results", menu: "Menu", skip: "Skip to main content", cart: "Cart", login: "Sign in with email", closeSearch: "Close search", quick: "Quick search", quickHint: "Enter at least 2 characters or open the catalog.", empty: "No products found", emptyHint: "Try another name or category.", closeMenu: "Close menu", open: "open", searchVerb: "search", close: "close" },
} satisfies Record<StoreLocale, Record<string, string>>;

export function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, cartCount, products, user } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const cartRef = useRef<HTMLAnchorElement>(null);
  const localeMenuRef = useRef<HTMLDivElement>(null);
  const searchLayerRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const menuBackdropRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const labels = copy[locale];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setLocaleOpen(false);
        setMenuOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const cartElement = cartRef.current;
    const onCartAdded = () => {
      const cart = cartElement;
      if (!cart || !canUseStoreMotion()) return;
      animationFrame = window.requestAnimationFrame(() => {
        void loadGsap().then((gsap) => {
          const badge = cart.querySelector<HTMLElement>("[data-cart-count]");
          const compact = prefersCompactMotion();
          gsap.killTweensOf(cart);
          gsap.timeline()
            .to(cart, { scale: 0.9, rotate: -5, duration: compact ? 0.05 : 0.07, ease: "power2.in" })
            .to(cart, { scale: 1.06, rotate: 3, duration: compact ? 0.1 : 0.14, ease: "back.out(2.5)" })
            .to(cart, { scale: 1, rotate: 0, duration: compact ? 0.12 : 0.16, ease: "power2.out", clearProps: "transform,willChange" });
          if (badge) gsap.fromTo(badge, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: compact ? 0.16 : 0.22, ease: "back.out(3)", clearProps: "transform,opacity,visibility,willChange" });
        });
      });
    };
    window.addEventListener(CART_ADDED_EVENT, onCartAdded);
    return () => {
      window.removeEventListener(CART_ADDED_EVENT, onCartAdded);
      window.cancelAnimationFrame(animationFrame);
      if (cartElement) void loadGsap().then((gsap) => gsap.killTweensOf(cartElement));
    };
  }, []);

  useEffect(() => {
    const menu = localeMenuRef.current;
    if (!localeOpen || !menu || !canUseStoreMotion()) return;
    let cancelled = false;
    void loadGsap().then((gsap) => {
      if (!cancelled) gsap.fromTo(menu, { autoAlpha: 0, y: -6, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: prefersCompactMotion() ? 0.16 : 0.21, ease: "power3.out", clearProps: "transform,opacity,visibility,willChange" });
    });
    return () => {
      cancelled = true;
      void loadGsap().then((gsap) => gsap.killTweensOf(menu));
    };
  }, [localeOpen]);

  useEffect(() => {
    const layer = searchLayerRef.current;
    const panel = searchPanelRef.current;
    if (!searchOpen || !layer || !panel || !canUseStoreMotion()) return;
    let cancelled = false;
    void loadGsap().then((gsap) => {
      if (cancelled) return;
      const compact = prefersCompactMotion();
      gsap.fromTo(layer, { autoAlpha: 0 }, { autoAlpha: 1, duration: compact ? 0.12 : 0.16, ease: "power2.out" });
      gsap.fromTo(panel, { autoAlpha: 0, y: compact ? -8 : -12, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: compact ? 0.24 : 0.3, ease: "power3.out", clearProps: "transform,opacity,visibility,willChange" });
    });
    return () => {
      cancelled = true;
      void loadGsap().then((gsap) => {
        gsap.killTweensOf(layer);
        gsap.killTweensOf(panel);
      });
    };
  }, [searchOpen]);

  useEffect(() => {
    const backdrop = menuBackdropRef.current;
    const panel = menuPanelRef.current;
    if (!menuOpen || !backdrop || !panel || !canUseStoreMotion()) return;
    let cancelled = false;
    void loadGsap().then((gsap) => {
      if (cancelled) return;
      gsap.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "power2.out" });
      gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.28, ease: "power3.out", clearProps: "transform,willChange" });
    });
    return () => {
      cancelled = true;
      void loadGsap().then((gsap) => {
        gsap.killTweensOf(backdrop);
        gsap.killTweensOf(panel);
      });
    };
  }, [menuOpen]);

  const results = useMemo(() => query.trim().length < 2 ? [] : products.filter((product) => `${product.name} ${product.category} ${product.specs.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4), [products, query]);

  const submitSearch = () => {
    const cleanQuery = query.trim();
    router.push(cleanQuery ? `/catalog?q=${encodeURIComponent(cleanQuery)}` : "/catalog");
  };

  const navItems = [
    { label: labels.catalog, href: "/catalog" },
    { label: labels.categories, href: "/catalog#categories" },
    { label: labels.benefits, href: "/#why-us" },
    { label: labels.admin, href: "/admin" },
  ];

  return (
    <>
      <a href="#main-content" className="sr-only z-[80] rounded-full bg-black px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{labels.skip}</a>
      <div className="bg-brand px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">{labels.announcement}</div>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white md:bg-white/88 md:backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link prefetch={false} href="/" className="flex cursor-pointer items-center gap-2 rounded-lg text-lg font-semibold tracking-[-0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <NexoraMark className="size-7 text-brand" />
            <span>nexorapro<span className="text-brand">.uz</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex" aria-label="Asosiy navigatsiya">
            {navItems.map((item) => <Link key={item.href} prefetch={false} href={item.href} onClick={() => { setSearchOpen(false); setLocaleOpen(false); }} className={cn("cursor-pointer rounded-md transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand", pathname === item.href && "text-black")}>{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button type="button" onClick={() => setLocaleOpen((value) => !value)} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Tilni tanlash" aria-expanded={localeOpen}>
                <Globe2 className="size-[18px]" /><span className="hidden sm:inline">{locale}</span>
              </button>
              {localeOpen && <div ref={localeMenuRef} className="absolute right-0 top-12 z-20 w-40 rounded-2xl border border-black/10 bg-white p-2 shadow-xl" role="menu">{(["UZ", "RU", "EN"] as const).map((item) => <button key={item} type="button" onClick={() => { setLocale(item); setLocaleOpen(false); }} className={cn("flex h-10 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors hover:bg-zinc-100", locale === item && "bg-brand/10 text-brand")} role="menuitem"><span>{item}</span><span className="text-xs text-zinc-400">{item === "UZ" ? "O‘zbek" : item === "RU" ? "Русский" : "English"}</span></button>)}</div>}
            </div>
            <button type="button" onClick={() => setSearchOpen(true)} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={labels.search}>
              <Search className="size-[18px]" />
            </button>
            <Link ref={cartRef} prefetch={false} href="/cart" className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={`${labels.cart}: ${cartCount}`}>
              <ShoppingBag className="size-[18px]" />
              {cartCount > 0 && <span data-cart-count className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-5 text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
            </Link>
            <Link prefetch={false} href={user ? "/account" : "/login"} className="hidden size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:inline-flex" aria-label={user ? user.name : labels.login}>
              <UserRound className="size-[18px]" />
            </Link>
            <button type="button" onClick={() => setMenuOpen(true)} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden" aria-label={labels.menu}>
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div ref={searchLayerRef} className="fixed inset-0 z-[70] bg-black/50 p-3 sm:bg-black/45 sm:p-6 sm:backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="store-search-title">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setSearchOpen(false)} aria-label={labels.closeSearch} />
          <div ref={searchPanelRef} className="relative mx-auto mt-[8vh] max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-black/10 p-4 sm:p-5">
              <Search className="size-5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1"><label id="store-search-title" htmlFor="global-product-search" className="sr-only">{labels.search}</label><input id="global-product-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} placeholder={labels.placeholder} className="h-10 w-full bg-transparent text-base outline-none placeholder:text-zinc-400 sm:text-lg" /></div>
              <button type="button" onClick={() => setSearchOpen(false)} className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-zinc-200" aria-label={labels.closeSearch}><X className="size-4" /></button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-3">
              {query.trim().length < 2 && <div className="px-3 py-8 text-center"><p className="font-medium">{labels.quick}</p><p className="mt-1 text-sm text-zinc-500">{labels.quickHint}</p></div>}
              {query.trim().length >= 2 && results.length === 0 && <div className="px-3 py-8 text-center"><p className="font-medium">{labels.empty}</p><p className="mt-1 text-sm text-zinc-500">{labels.emptyHint}</p></div>}
              {results.map((product) => <Link key={product.id} prefetch={false} href={`/product/${product.slug}`} onClick={() => setSearchOpen(false)} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><div><p className="font-semibold">{product.name}</p><p className="mt-0.5 text-xs text-zinc-500">{product.category} · {product.specs.slice(0, 2).join(" · ")}</p></div><ArrowRight className="size-4 shrink-0 text-brand" /></Link>)}
              <button type="button" onClick={submitSearch} className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Search className="size-4" />{labels.all}</button>
            </div>
            <div className="hidden items-center justify-between border-t border-black/5 bg-zinc-50 px-5 py-3 text-xs text-zinc-500 sm:flex"><span>Enter — {labels.searchVerb}</span><span>⌘ K — {labels.open} · Esc — {labels.close}</span></div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button ref={menuBackdropRef} type="button" className="absolute inset-0 cursor-default bg-black/50" onClick={() => setMenuOpen(false)} aria-label={labels.closeMenu} />
          <aside ref={menuPanelRef} className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white p-5 shadow-2xl" aria-label="Mobil menyu">
            <div className="flex items-center justify-between"><span className="font-semibold">{labels.menu}</span><button type="button" onClick={() => setMenuOpen(false)} className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-zinc-100" aria-label={labels.closeMenu}><X className="size-5" /></button></div>
            <nav className="mt-8 space-y-2">{navItems.map((item) => <Link key={item.href} prefetch={false} href={item.href} onClick={() => setMenuOpen(false)} className="flex h-14 cursor-pointer items-center justify-between rounded-2xl border border-black/5 px-4 text-lg font-semibold transition-colors hover:bg-zinc-100">{item.label}<ArrowRight className="size-4 text-brand" /></Link>)}</nav>
            <div className="mt-auto space-y-2 border-t border-black/10 pt-5"><Link prefetch={false} href="/cart" className="flex h-12 cursor-pointer items-center justify-between rounded-xl bg-brand px-4 text-sm font-semibold text-white"><span className="inline-flex items-center gap-2"><ShoppingBag className="size-4" />{labels.cart}</span><span>{cartCount}</span></Link><Link prefetch={false} href={user ? "/account" : "/login"} className="flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-zinc-100 px-4 text-sm font-semibold"><UserRound className="size-4" />{user ? user.name : labels.login}</Link><Link prefetch={false} href="/admin" className="flex h-12 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-semibold text-zinc-600"><UserRound className="size-4" />{labels.admin}</Link></div>
          </aside>
        </div>
      )}
    </>
  );
}
