"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storefrontProducts, type StoreProduct } from "@/lib/storefront-data";
import type { AuthUser } from "@/lib/auth";
import { CART_ADDED_EVENT, type CartAddedDetail } from "@/lib/storefront-motion";

export type StoreLocale = "UZ" | "RU" | "EN";
type CartItem = { productId: string; quantity: number };
type CartLine = { product: StoreProduct; quantity: number };

type StoreContextValue = {
  user: AuthUser | null;
  locale: StoreLocale;
  setLocale: (locale: StoreLocale) => void;
  products: StoreProduct[];
  cartItems: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const CART_KEY = "nexorapro-cart-v1";
const LOCALE_KEY = "nexorapro-locale-v1";

export function StoreProvider({ children, initialProducts = storefrontProducts, initialUser = null }: { children: React.ReactNode; initialProducts?: StoreProduct[]; initialUser?: AuthUser | null }) {
  const [locale, setLocaleState] = useState<StoreLocale>("UZ");
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedCart = window.localStorage.getItem(CART_KEY);
        const savedLocale = window.localStorage.getItem(LOCALE_KEY) as StoreLocale | null;
        if (savedCart) setCartItems(JSON.parse(savedCart) as CartItem[]);
        if (savedLocale && ["UZ", "RU", "EN"].includes(savedLocale)) setLocaleState(savedLocale);
      } catch {
        window.localStorage.removeItem(CART_KEY);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/products?scope=storefront", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ products: StoreProduct[] }> : null)
      .then((payload) => { if (active && payload) setProducts(payload.products); })
      .catch(() => undefined);
    // SSR already provides fresh products, so skip the redundant refetch on
    // load (it re-renders the tree during the LCP window). Refresh only when
    // the tab regains focus, and after the page has gone idle.
    const onFocus = () => void refresh();
    const idle = window.setTimeout(() => { if (active) void refresh(); }, 4000);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearTimeout(idle);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const setLocale = (nextLocale: StoreLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_KEY, nextLocale);
  };

  const addToCart = useCallback((productId: string, quantity = 1) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const safeQuantity = Math.min(product.stock, Math.max(1, quantity));
    setCartItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (!existing) return [...current, { productId, quantity: safeQuantity }];
      return current.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(product.stock, item.quantity + safeQuantity) }
        : item);
    });
    window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, {
      detail: { productId, quantity: safeQuantity },
    }));
  }, [products]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (quantity <= 0) {
      setCartItems((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    setCartItems((current) => current.map((item) => item.productId === productId
      ? { ...item, quantity: Math.min(product.stock, quantity) }
      : item));
  }, [products]);

  const cartLines = useMemo(() => cartItems.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  }), [cartItems, products]);

  const value = useMemo<StoreContextValue>(() => ({
    user: initialUser,
    locale,
    setLocale,
    products,
    cartItems,
    cartLines,
    cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    addToCart,
    updateQuantity,
    removeFromCart: (productId) => setCartItems((current) => current.filter((item) => item.productId !== productId)),
    clearCart: () => setCartItems([]),
  }), [addToCart, cartItems, cartLines, initialUser, locale, products, updateQuantity]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
