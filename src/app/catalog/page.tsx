import type { Metadata } from "next";

import { CatalogClient } from "@/components/storefront/catalog-client";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";

export const metadata: Metadata = { title: "Katalog", description: "nexorapro.uz premium texnologiyalar katalogi." };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><StoreHeader /><CatalogClient initialCategory={category} initialQuery={q} /><StoreFooter /></div>;
}
