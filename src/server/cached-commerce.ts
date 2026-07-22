import "server-only";

import { unstable_cache } from "next/cache";

import { toStorefrontProduct } from "@/lib/commerce";
import { getAnalytics, getInventoryReport, getProduct, getSalesReport, listProducts } from "@/server/commerce-repository";

export const COMMERCE_CACHE_TAGS = {
  products: "commerce:products",
  orders: "commerce:orders",
  inventory: "commerce:inventory",
  analytics: "commerce:analytics",
} as const;

export const getCachedStorefrontProducts = unstable_cache(
  async () => listProducts({ storefrontOnly: true }).map(toStorefrontProduct),
  ["storefront-products-v2"],
  { tags: [COMMERCE_CACHE_TAGS.products], revalidate: 300 },
);

export const getCachedStorefrontProduct = unstable_cache(
  async (slug: string) => {
    const product = getProduct(slug);
    return product?.status === "published" && product.visibleOnStorefront ? toStorefrontProduct(product) : null;
  },
  ["storefront-product-v2"],
  { tags: [COMMERCE_CACHE_TAGS.products], revalidate: 300 },
);

export const getCachedAnalytics = unstable_cache(
  async () => getAnalytics(),
  ["commerce-analytics-v1"],
  { tags: [COMMERCE_CACHE_TAGS.analytics, COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.orders, COMMERCE_CACHE_TAGS.inventory], revalidate: 60 },
);

export const getCachedSalesReport = unstable_cache(
  async (from?: string, to?: string, limit?: number) => getSalesReport({ from, to, limit }),
  ["commerce-sales-report-v1"],
  { tags: [COMMERCE_CACHE_TAGS.analytics, COMMERCE_CACHE_TAGS.orders], revalidate: 60 },
);

export const getCachedInventoryReport = unstable_cache(
  async (threshold: number) => getInventoryReport(threshold),
  ["commerce-inventory-report-v1"],
  { tags: [COMMERCE_CACHE_TAGS.analytics, COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.inventory], revalidate: 60 },
);
