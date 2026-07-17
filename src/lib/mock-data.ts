import type { Product } from "@/lib/types";

export const products: Product[] = [
  { id: "prd_001", name: "iPhone 16 Pro", sku: "APL-IP16P-256-TI", category: "Smartfon", costPrice: 14800000, price: 16999000, compareAtPrice: 17999000, stock: 24, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 138 },
  { id: "prd_002", name: "MacBook Air 13", sku: "APL-MBA13-512-SL", category: "Noutbuk", costPrice: 16600000, price: 18999000, stock: 8, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 64 },
  { id: "prd_003", name: "AirPods Pro", sku: "APL-APP-USB-C", category: "Audio", costPrice: 2450000, price: 3199000, stock: 41, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU"], sales: 211 },
  { id: "prd_004", name: "iPad Air 11", sku: "APL-IPA11-256-BL", category: "Planshet", costPrice: 8900000, price: 10499000, stock: 5, status: "draft", visibleOnStorefront: false, languages: ["UZ"], sales: 19 },
  { id: "prd_005", name: "Magic Keyboard", sku: "APL-MGK-US-WH", category: "Aksessuar", costPrice: 1400000, price: 1899000, stock: 0, status: "archived", visibleOnStorefront: false, languages: ["UZ", "RU", "EN"], sales: 47 },
  { id: "prd_006", name: "MacBook Pro 14", sku: "APL-MBP14-1TB-BK", category: "Noutbuk", costPrice: 25800000, price: 28999000, stock: 3, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 32 },
];

export const featuredProducts = [
  { id: "featured-1", name: "iPhone 16 Pro", category: "Smartfon", subtitle: "Titanium. Kuchli. Nafis.", price: "16 999 000 so‘mdan", art: "phone" as const, tone: "teal" as const },
  { id: "featured-2", name: "MacBook Air", category: "Noutbuk", subtitle: "Yengil dizayn. Katta imkoniyat.", price: "18 999 000 so‘mdan", art: "laptop" as const, tone: "silver" as const },
  { id: "featured-3", name: "AirPods Pro", category: "Audio", subtitle: "Ovozning yangi darajasi.", price: "3 199 000 so‘mdan", art: "audio" as const, tone: "silver" as const },
];

export const salesData = [
  { day: "01", revenue: 42, orders: 14 },
  { day: "05", revenue: 58, orders: 19 },
  { day: "09", revenue: 51, orders: 17 },
  { day: "13", revenue: 76, orders: 25 },
  { day: "17", revenue: 68, orders: 21 },
  { day: "21", revenue: 94, orders: 31 },
  { day: "25", revenue: 88, orders: 28 },
  { day: "30", revenue: 112, orders: 36 },
];

export const categoryData = [
  { name: "Smartfon", value: 48 },
  { name: "Noutbuk", value: 27 },
  { name: "Audio", value: 16 },
  { name: "Boshqa", value: 9 },
];
