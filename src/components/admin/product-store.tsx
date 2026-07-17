"use client";

import { createContext, useContext, useState } from "react";

import { products as seedProducts } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

type SaleLine = { productId: string; quantity: number };

type ProductStoreValue = {
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "sales">) => void;
  toggleVisibility: (id: string) => void;
  restockProduct: (id: string, quantity: number) => void;
  addProductLanguage: (id: string, language: "UZ" | "RU" | "EN") => void;
  recordSale: (lines: SaleLine[]) => void;
};

const ProductStoreContext = createContext<ProductStoreValue | null>(null);

export function ProductStoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);

  const addProduct = (product: Omit<Product, "id" | "sales">) => {
    setProducts((current) => [{ ...product, id: `prd_${Date.now()}`, sales: 0 }, ...current]);
  };

  const toggleVisibility = (id: string) => {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, visibleOnStorefront: !product.visibleOnStorefront } : product));
  };

  const restockProduct = (id: string, quantity: number) => {
    setProducts((current) => current.map((product) => product.id === id ? { ...product, stock: product.stock + Math.max(0, quantity) } : product));
  };

  const addProductLanguage = (id: string, language: "UZ" | "RU" | "EN") => {
    setProducts((current) => current.map((product) => product.id === id && !product.languages.includes(language)
      ? { ...product, languages: [...product.languages, language] }
      : product));
  };

  const recordSale = (lines: SaleLine[]) => {
    const quantities = new Map(lines.map((line) => [line.productId, line.quantity]));
    setProducts((current) => current.map((product) => {
      const quantity = quantities.get(product.id) ?? 0;
      return quantity > 0
        ? { ...product, stock: Math.max(0, product.stock - quantity), sales: product.sales + quantity }
        : product;
    }));
  };

  return <ProductStoreContext.Provider value={{ products, addProduct, toggleVisibility, restockProduct, addProductLanguage, recordSale }}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const value = useContext(ProductStoreContext);
  if (!value) throw new Error("useProductStore must be used inside ProductStoreProvider");
  return value;
}
