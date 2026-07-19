import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { COMMERCE_CACHE_TAGS } from "@/server/cached-commerce";

function expire(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

export function invalidateProducts(slugs: string[] = []) {
  expire(COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.analytics);
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/product/[slug]", "page");
  for (const slug of slugs) revalidatePath(`/product/${slug}`);
  revalidatePath("/admin", "layout");
}

export function invalidateOrders() {
  expire(COMMERCE_CACHE_TAGS.orders, COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.inventory, COMMERCE_CACHE_TAGS.analytics);
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/account");
  revalidatePath("/admin", "layout");
}

export function invalidateInventory() {
  expire(COMMERCE_CACHE_TAGS.inventory, COMMERCE_CACHE_TAGS.products, COMMERCE_CACHE_TAGS.analytics);
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/admin", "layout");
}
