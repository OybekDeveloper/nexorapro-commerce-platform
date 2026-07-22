import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/storefront/product-details";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { storefrontProducts } from "@/lib/storefront-data";
import { getCachedStorefrontProduct } from "@/server/cached-commerce";

export function generateStaticParams() { return storefrontProducts.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedStorefrontProduct(slug);
  return product ? { title: product.name, description: product.description } : { title: "Mahsulot topilmadi" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCachedStorefrontProduct(slug);
  if (!product || !product.visibleOnStorefront || product.status !== "published") notFound();
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader />
      <ProductDetails initialProduct={product} />
      <StoreFooter />
    </div>
  );
}
