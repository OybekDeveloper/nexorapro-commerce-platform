import type { Metadata } from "next";

import { CartPageContent } from "@/components/storefront/cart-page";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";

export const metadata: Metadata = { title: "Savat", description: "nexorapro.uz xarid savati va demo checkout." };

export default function CartPage() {
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><StoreHeader /><CartPageContent /><StoreFooter /></div>;
}
