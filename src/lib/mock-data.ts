import type { Product } from "@/lib/types";

export const products: Product[] = [
  { id: "prd_001", name: "iPhone 17 Pro", sku: "APL-IP17P-256-OR", category: "Smartfon", costPrice: 18100000, price: 20999000, compareAtPrice: 21999000, videoUrl: "https://www.apple.com/newsroom/videos/2025/autoplay/09/apple-iphone-17-pro-forged-plateau/large_2x.mp4", videoPosterUrl: "https://www.apple.com/newsroom/videos/2025/autoplay/09/apple-iphone-17-pro-forged-plateau/posters/Apple-iPhone-17-Pro-forged-plateau-250909.jpg.large_2x.jpg", stock: 18, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 146 },
  { id: "prd_002", name: "iPhone 17 Pro Max", sku: "APL-IP17PM-512-OR", category: "Smartfon", costPrice: 22800000, price: 26499000, stock: 7, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU"], sales: 79 },
  { id: "prd_003", name: "MacBook Air 13 M5", sku: "APL-MBA13-M5-512-SB", category: "Noutbuk", costPrice: 15100000, price: 17999000, compareAtPrice: 18999000, stock: 12, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 68 },
  { id: "prd_004", name: "MacBook Air 15 M5", sku: "APL-MBA15-M5-512-SB", category: "Noutbuk", costPrice: 18300000, price: 21499000, stock: 6, status: "published", visibleOnStorefront: true, languages: ["UZ", "EN"], sales: 41 },
  { id: "prd_005", name: "iPad Air 11 M4", sku: "APL-IPA11-M4-256-BL", category: "Planshet", costPrice: 9100000, price: 10999000, stock: 9, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU", "EN"], sales: 36 },
  { id: "prd_006", name: "iPad Air 13 M4", sku: "APL-IPA13-M4-256-BL", category: "Planshet", costPrice: 11600000, price: 13999000, stock: 4, status: "draft", visibleOnStorefront: false, languages: ["UZ"], sales: 17 },
  { id: "prd_007", name: "AirPods Pro 3", sku: "APL-APP3-USB-C", category: "Audio", costPrice: 2750000, price: 3499000, compareAtPrice: 3799000, stock: 32, status: "published", visibleOnStorefront: true, languages: ["UZ", "RU"], sales: 226 },
  { id: "prd_008", name: "Magic Keyboard", sku: "APL-MGK-US-WH", category: "Aksessuar", costPrice: 1400000, price: 1899000, stock: 0, status: "archived", visibleOnStorefront: false, languages: ["UZ", "RU", "EN"], sales: 47 },
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
