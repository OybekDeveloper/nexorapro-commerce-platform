"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { type StoreProduct, type StoreProductVariant } from "@/lib/storefront-data";
import type { AuthUser } from "@/lib/auth";
import { localizeProduct } from "@/lib/commerce";
import { CART_ADDED_EVENT, type CartAddedDetail } from "@/lib/storefront-motion";

export type StoreLocale = "UZ" | "RU" | "EN";
type CartItem = { productId: string; variantId?: string; quantity: number };
type CartLine = { product: StoreProduct; variant?: StoreProductVariant; quantity: number; unitPrice: number; availableStock: number };

type StoreContextValue = {
  user: AuthUser | null;
  locale: StoreLocale;
  setLocale: (locale: StoreLocale) => void;
  products: StoreProduct[];
  cartItems: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const CART_KEY = "nexorapro-cart-v1";
const LOCALE_KEY = "nexorapro-locale-v1";
const cartKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? ""}`;

function parseSavedCart(value: string): CartItem[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.productId !== "string" || typeof candidate.quantity !== "number" || !Number.isInteger(candidate.quantity) || candidate.quantity <= 0) return [];
    if (candidate.variantId !== undefined && typeof candidate.variantId !== "string") return [];
    return [{ productId: candidate.productId, variantId: candidate.variantId as string | undefined, quantity: Math.min(100, candidate.quantity) }];
  });
}

export function StoreProvider({ children, initialProducts = [], initialUser = null }: { children: React.ReactNode; initialProducts?: StoreProduct[]; initialUser?: AuthUser | null }) {
  const [locale, setLocaleState] = useState<StoreLocale>("UZ");
  const [sourceProducts, setSourceProducts] = useState<StoreProduct[]>(initialProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedCart = window.localStorage.getItem(CART_KEY);
        const savedLocale = window.localStorage.getItem(LOCALE_KEY) as StoreLocale | null;
        if (savedCart) setCartItems(parseSavedCart(savedCart));
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
      .then((payload) => { if (active && payload) setSourceProducts(payload.products); })
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

  useEffect(() => {
    document.documentElement.lang = locale.toLowerCase();
  }, [locale]);

  const products = useMemo(
    () => sourceProducts.map((product) => localizeProduct(product, locale)),
    [locale, sourceProducts],
  );

  const addToCart = useCallback((productId: string, quantity = 1, variantId?: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const activeVariants = product.variants?.filter((variant) => variant.status === "active") ?? [];
    const variant = variantId ? activeVariants.find((item) => item.id === variantId) : undefined;
    if (activeVariants.length > 0 && !variant) return;
    const availableStock = variant?.availableStock ?? variant?.stock ?? product.availableStock ?? product.stock;
    if (availableStock <= 0) return;
    const safeQuantity = Math.min(availableStock, Math.max(1, quantity));
    const key = cartKey(productId, variantId);
    setCartItems((current) => {
      const existing = current.find((item) => cartKey(item.productId, item.variantId) === key);
      if (!existing) return [...current, { productId, variantId, quantity: safeQuantity }];
      return current.map((item) => cartKey(item.productId, item.variantId) === key
        ? { ...item, quantity: Math.min(availableStock, item.quantity + safeQuantity) }
        : item);
    });
    window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, {
      detail: { productId, quantity: safeQuantity },
    }));
  }, [products]);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const variant = variantId ? product.variants?.find((item) => item.id === variantId && item.status === "active") : undefined;
    const activeVariants = product.variants?.filter((item) => item.status === "active") ?? [];
    if (activeVariants.length > 0 && !variant) return;
    const availableStock = variant?.availableStock ?? variant?.stock ?? product.availableStock ?? product.stock;
    const key = cartKey(productId, variantId);
    if (quantity <= 0) {
      setCartItems((current) => current.filter((item) => cartKey(item.productId, item.variantId) !== key));
      return;
    }
    setCartItems((current) => current.map((item) => cartKey(item.productId, item.variantId) === key
      ? { ...item, quantity: Math.min(availableStock, quantity) }
      : item));
  }, [products]);

  const cartLines = useMemo(() => cartItems.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return [];
    const activeVariants = product.variants?.filter((variant) => variant.status === "active") ?? [];
    const variant = item.variantId ? activeVariants.find((candidate) => candidate.id === item.variantId) : undefined;
    if (activeVariants.length > 0 && !variant) return [];
    const availableStock = variant?.availableStock ?? variant?.stock ?? product.availableStock ?? product.stock;
    if (availableStock <= 0) return [];
    return [{ product, variant, quantity: Math.min(item.quantity, availableStock), unitPrice: variant?.price ?? product.price, availableStock }];
  }), [cartItems, products]);

  const value = useMemo<StoreContextValue>(() => ({
    user: initialUser,
    locale,
    setLocale,
    products,
    cartItems,
    cartLines,
    cartCount: cartLines.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    addToCart,
    updateQuantity,
    removeFromCart: (productId, variantId) => setCartItems((current) => current.filter((item) => cartKey(item.productId, item.variantId) !== cartKey(productId, variantId))),
    clearCart: () => setCartItems([]),
  }), [addToCart, cartItems, cartLines, initialUser, locale, products, updateQuantity]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
