import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogClient, CatalogFromParams } from "@/components/storefront/catalog-client";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";

export const metadata: Metadata = { title: "Katalog", description: "nexorapro.uz premium texnologiyalar katalogi." };

// The page is fully static; URL filters (?category=, ?q=) are read on the
// client inside CatalogFromParams. The Suspense fallback prerenders the
// unfiltered catalog so the static HTML still contains the complete grid.
export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader />
      <Suspense fallback={<CatalogClient />}>
        <CatalogFromParams />
      </Suspense>
      <StoreFooter />
    </div>
  );
}
