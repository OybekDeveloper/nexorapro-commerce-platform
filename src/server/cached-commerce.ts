import "server-only";

import { unstable_cache } from "next/cache";

import { getAnalytics, getProduct, listProducts } from "@/server/commerce-repository";

export const COMMERCE_CACHE_TAGS = {
  products: "commerce:products",
  orders: "commerce:orders",
  inventory: "commerce:inventory",
  analytics: "commerce:analytics",
} as const;

export const getCachedStorefrontProducts = unstable_cache(
  async () => listProducts({ storefrontOnly: true }),
  ["storefront-products-v1"],
  { tags: [COMMERCE_CACHE_TAGS.products], revalidate: 300 },
);

export const getCachedStorefrontProduct = unstable_cache(
  async (slug: string) => getProduct(slug),
  ["storefront-product-v1"],
  { tags: [COMMERCE_CACHE_TAGS.products], revalidate: 300 },
);

export const getCachedAnalytics = unstable_cache(
  async () => getAnalytics(),
  ["commerce-analytics-v1"],
  { tags: [COMMERCE_CACHE_TAGS.analytics, COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.orders, COMMERCE_CACHE_TAGS.inventory], revalidate: 60 },
);
