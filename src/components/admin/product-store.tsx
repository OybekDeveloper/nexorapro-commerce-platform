"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api-client";
import type { CommerceOrder } from "@/lib/commerce";
import type { Product, ProductLanguage, ProductTranslation } from "@/lib/types";

type SaleLine = { productId: string; quantity: number };
export type NewProductInput = Omit<Product, "id" | "sales" | "translations"> & {
  description?: string;
  image?: string;
  imageAlt?: string;
  translations: Partial<Record<ProductLanguage, ProductTranslation>>;
};

type ProductStoreValue = {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (product: NewProductInput) => Promise<void>;
  toggleVisibility: (id: string) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;
  restockProduct: (id: string, quantity: number) => Promise<void>;
  saveProductTranslation: (id: string, language: ProductLanguage, translation: ProductTranslation) => Promise<void>;
  recordSale: (lines: SaleLine[], details?: { customer?: string; payment?: "cash" | "card" | "installment"; discount?: number }) => Promise<CommerceOrder>;
};

const ProductStoreContext = createContext<ProductStoreValue | null>(null);

export function ProductStoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setError(null);
    try { return await action(); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : "Amal bajarilmadi";
      setError(message);
      throw cause;
    }
  }, []);

  const refreshProducts = useCallback(async () => run(async () => {
    const payload = await apiRequest<{ products: Product[] }>("/api/products");
    setProducts(payload.products);
    setLoading(false);
  }), [run]);

  useEffect(() => {
    let active = true;
    apiRequest<{ products: Product[] }>("/api/products")
      .then((payload) => { if (active) setProducts(payload.products); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Mahsulotlar yuklanmadi"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const addProduct = (product: NewProductInput) => run(async () => {
    const payload = await apiRequest<{ product: Product }>("/api/products", { method: "POST", body: JSON.stringify(product) });
    setProducts((current) => [payload.product, ...current]);
  });

  const toggleVisibility = (id: string) => run(async () => {
    const current = products.find((product) => product.id === id);
    if (!current) return;
    const payload = await apiRequest<{ product: Product }>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ visibleOnStorefront: !current.visibleOnStorefront }) });
    setProducts((items) => items.map((product) => product.id === id ? payload.product : product));
  });

  const archiveProduct = (id: string) => run(async () => {
    const payload = await apiRequest<{ product: Product }>(`/api/products/${id}`, { method: "DELETE" });
    setProducts((items) => items.map((product) => product.id === id ? payload.product : product));
  });

  const restockProduct = (id: string, quantity: number) => run(async () => {
    await apiRequest("/api/inventory", { method: "POST", body: JSON.stringify({ productId: id, quantity, type: "restock", location: "Asosiy ombor", note: "Admin panel orqali kirim" }) });
    await refreshProducts();
  });

  const saveProductTranslation = (id: string, language: ProductLanguage, translation: ProductTranslation) => run(async () => {
    const payload = await apiRequest<{ product: Product }>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ translations: { [language]: translation } }) });
    setProducts((items) => items.map((product) => product.id === id ? payload.product : product));
  });

  const recordSale = (lines: SaleLine[], details: { customer?: string; payment?: "cash" | "card" | "installment"; discount?: number } = {}) => run(async () => {
    const payload = await apiRequest<{ order: CommerceOrder }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items: lines, channel: "POS", customer: details.customer || "POS mijoz", payment: details.payment ?? "card", discount: details.discount ?? 0 }),
    });
    await refreshProducts();
    return payload.order;
  });

  return <ProductStoreContext.Provider value={{ products, loading, error, refreshProducts, addProduct, toggleVisibility, archiveProduct, restockProduct, saveProductTranslation, recordSale }}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const value = useContext(ProductStoreContext);
  if (!value) throw new Error("useProductStore must be used inside ProductStoreProvider");
  return value;
}
