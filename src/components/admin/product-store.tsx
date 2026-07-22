"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api-client";
import type { BulkProductInput, CommerceOrder, CommerceProduct, CreateProductInput, ProductMediaInput, UpdateProductInput } from "@/lib/commerce";
import type { ProductLanguage, ProductTranslation } from "@/lib/types";

type SaleLine = { productId: string; variantId?: string; quantity: number };
export type NewProductInput = CreateProductInput;

type ProductStoreValue = {
  products: CommerceProduct[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (product: NewProductInput) => Promise<void>;
  updateProduct: (id: string, product: UpdateProductInput) => Promise<void>;
  toggleVisibility: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkProducts: (ids: string[], action: BulkProductInput["action"]) => Promise<void>;
  uploadProductImage: (file: File, altText: string) => Promise<ProductMediaInput>;
  restockProduct: (id: string, quantity: number, variantId?: string) => Promise<void>;
  saveProductTranslation: (id: string, language: ProductLanguage, translation: ProductTranslation) => Promise<void>;
  recordSale: (lines: SaleLine[], details?: { customer?: string; payment?: "cash" | "card" | "installment"; discount?: number }) => Promise<CommerceOrder>;
};

const ProductStoreContext = createContext<ProductStoreValue | null>(null);

export function ProductStoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<CommerceProduct[]>([]);
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
    const payload = await apiRequest<{ products: CommerceProduct[] }>("/api/products?pageSize=100&includeDeleted=true");
    setProducts(payload.products);
    setLoading(false);
  }), [run]);

  useEffect(() => {
    let active = true;
    apiRequest<{ products: CommerceProduct[] }>("/api/products?pageSize=100&includeDeleted=true")
      .then((payload) => { if (active) setProducts(payload.products); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Mahsulotlar yuklanmadi"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const addProduct = (product: NewProductInput) => run(async () => {
    const payload = await apiRequest<{ product: CommerceProduct }>("/api/products", { method: "POST", body: JSON.stringify(product) });
    setProducts((current) => [payload.product, ...current]);
  });

  const updateProduct = (id: string, product: UpdateProductInput) => run(async () => {
    const current = products.find((item) => item.id === id);
    const payload = await apiRequest<{ product: CommerceProduct }>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...product, version: product.version ?? current?.version }),
    });
    setProducts((items) => items.map((item) => item.id === id ? payload.product : item));
  });

  const toggleVisibility = (id: string) => run(async () => {
    const current = products.find((product) => product.id === id);
    if (!current) return;
    const payload = await apiRequest<{ product: CommerceProduct }>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ visibleOnStorefront: !current.visibleOnStorefront, version: current.version }) });
    setProducts((items) => items.map((product) => product.id === id ? payload.product : product));
  });

  const deleteProduct = (id: string) => run(async () => {
    const payload = await apiRequest<{ product: CommerceProduct }>(`/api/products/${id}`, { method: "DELETE" });
    setProducts((items) => items.map((product) => product.id === id ? payload.product : product));
  });

  const bulkProducts = (ids: string[], action: BulkProductInput["action"]) => run(async () => {
    const versionById = Object.fromEntries(products.filter((product) => ids.includes(product.id)).map((product) => [product.id, product.version]));
    await apiRequest("/api/products/bulk", { method: "POST", body: JSON.stringify({ ids, action, versionById }) });
    await refreshProducts();
  });

  const uploadProductImage = (file: File, altText: string) => run(async () => {
    const form = new FormData();
    form.set("file", file);
    form.set("altText", altText);
    form.set("isPrimary", "true");
    const payload = await apiRequest<{ media: ProductMediaInput }>("/api/products/media", { method: "POST", body: form });
    return payload.media;
  });

  const restockProduct = (id: string, quantity: number, variantId?: string) => run(async () => {
    await apiRequest("/api/inventory", { method: "POST", body: JSON.stringify({ productId: id, variantId, quantity, type: "restock", location: "Asosiy ombor", note: "Admin panel orqali kirim" }) });
    await refreshProducts();
  });

  const saveProductTranslation = (id: string, language: ProductLanguage, translation: ProductTranslation) => run(async () => {
    const current = products.find((product) => product.id === id);
    const payload = await apiRequest<{ product: CommerceProduct }>(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ translations: { [language]: translation }, version: current?.version }) });
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

  return <ProductStoreContext.Provider value={{ products, loading, error, refreshProducts, addProduct, updateProduct, toggleVisibility, deleteProduct, bulkProducts, uploadProductImage, restockProduct, saveProductTranslation, recordSale }}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const value = useContext(ProductStoreContext);
  if (!value) throw new Error("useProductStore must be used inside ProductStoreProvider");
  return value;
}
