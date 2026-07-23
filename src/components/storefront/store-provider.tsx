"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { type StoreProduct, type StoreProductVariant } from "@/lib/storefront-data";
import type { AuthUser } from "@/lib/auth";
import { localizeProduct } from "@/lib/commerce";
import { CART_ADDED_EVENT, type CartAddedDetail } from "@/lib/storefront-motion";

export type StoreLocale = "UZ" | "RU" | "EN";
type CartItem = { productId: string; variantId?: string; quantity: number };
type CartLine = { product: StoreProduct; variant?: StoreProductVariant; quantity: number; unitPrice: number; availableStock: number };

type StoreDataValue = {
  user: AuthUser | null;
  locale: StoreLocale;
  setLocale: (locale: StoreLocale) => void;
  products: StoreProduct[];
};

type CartStateValue = {
  cartItems: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  subtotal: number;
};

type CartActionsValue = {
  addToCart: (productId: string, quantity?: number, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
};

type StoreContextValue = StoreDataValue & CartStateValue & CartActionsValue;

const StoreDataContext = createContext<StoreDataValue | null>(null);
const CartStateContext = createContext<CartStateValue | null>(null);
const CartActionsContext = createContext<CartActionsValue | null>(null);
const CART_KEY = "nexorapro-cart-v1";
const LOCALE_KEY = "nexorapro-locale-v1";
export const AUTH_SESSION_CHANGED_EVENT = "nexorapro:auth-session-changed";
const cartKey = (productId: string, variantId?: string) => `${productId}:${variantId ?? ""}`;

function sameUser(a: AuthUser | null, b: AuthUser | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.name === b.name && a.email === b.email && a.role === b.role;
}

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
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const refreshUser = useCallback(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ user: AuthUser | null }> : null)
      .then((payload) => {
        if (!payload) return;
        startTransition(() => setUser((current) => sameUser(current, payload.user) ? current : payload.user));
      })
      .catch(() => undefined);
  }, []);

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
    const idle = window.setTimeout(() => {
      void fetch("/api/auth/me", { cache: "no-store" })
        .then((response) => response.ok ? response.json() as Promise<{ user: AuthUser | null }> : null)
        .then((payload) => {
          if (!active || !payload) return;
          startTransition(() => setUser((current) => sameUser(current, payload.user) ? current : payload.user));
        })
        .catch(() => undefined);
    }, 1200);
    return () => {
      active = false;
      window.clearTimeout(idle);
    };
  }, [initialUser]);

  useEffect(() => {
    const onAuthChanged = () => refreshUser();
    const onFocus = () => refreshUser();
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshUser]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const setLocale = useCallback((nextLocale: StoreLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(LOCALE_KEY, nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.toLowerCase();
  }, [locale]);

  const products = useMemo(
    () => initialProducts.map((product) => localizeProduct(product, locale)),
    [initialProducts, locale],
  );

  // Cart actions read the current catalog through a ref so their identities stay
  // stable across locale/product updates; consumers of CartActionsContext never
  // re-render because of catalog or cart changes. Actions run from event
  // handlers, which always fire after this effect has synced the ref.
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const addToCart = useCallback((productId: string, quantity = 1, variantId?: string) => {
    const product = productsRef.current.find((item) => item.id === productId);
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
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    const product = productsRef.current.find((item) => item.id === productId);
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
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCartItems((current) => current.filter((item) => cartKey(item.productId, item.variantId) !== cartKey(productId, variantId)));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

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

  const dataValue = useMemo<StoreDataValue>(() => ({ user, locale, setLocale, products }), [user, locale, setLocale, products]);

  const cartStateValue = useMemo<CartStateValue>(() => ({
    cartItems,
    cartLines,
    cartCount: cartLines.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  }), [cartItems, cartLines]);

  const cartActionsValue = useMemo<CartActionsValue>(() => ({ addToCart, updateQuantity, removeFromCart, clearCart }), [addToCart, updateQuantity, removeFromCart, clearCart]);

  return (
    <StoreDataContext.Provider value={dataValue}>
      <CartStateContext.Provider value={cartStateValue}>
        <CartActionsContext.Provider value={cartActionsValue}>{children}</CartActionsContext.Provider>
      </CartStateContext.Provider>
    </StoreDataContext.Provider>
  );
}

/** Catalog, locale, and session data. Does not change on cart mutations. */
export function useStoreData() {
  const value = useContext(StoreDataContext);
  if (!value) throw new Error("useStoreData must be used inside StoreProvider");
  return value;
}

/** Cart contents. Subscribes the component to every cart mutation. */
export function useCartState() {
  const value = useContext(CartStateContext);
  if (!value) throw new Error("useCartState must be used inside StoreProvider");
  return value;
}

/** Stable cart mutators. Never re-renders the component on cart changes. */
export function useCartActions() {
  const value = useContext(CartActionsContext);
  if (!value) throw new Error("useCartActions must be used inside StoreProvider");
  return value;
}

/** Combined view for screens that need everything (e.g. the cart page). */
export function useStore(): StoreContextValue {
  const data = useStoreData();
  const cartState = useCartState();
  const cartActions = useCartActions();
  return useMemo(() => ({ ...data, ...cartState, ...cartActions }), [data, cartState, cartActions]);
}
