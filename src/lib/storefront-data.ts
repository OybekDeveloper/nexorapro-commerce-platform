export type StoreCategory = "Smartfon" | "Noutbuk" | "Planshet" | "Audio" | "Aksessuar";

export type StoreProductVideo = {
  src: string;
  poster: string;
  title: string;
  eyebrow: string;
  sourceUrl: string;
};

export type StoreProductVariant = {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  status: "active" | "disabled";
  options: Record<string, string>;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  category: StoreCategory;
  description: string;
  image: string;
  imageAlt: string;
  video?: StoreProductVideo;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  rating: number;
  reviews: number;
  colors: string[];
  specs: string[];
  featured: boolean;
  variants?: StoreProductVariant[];
  languages?: import("@/lib/types").ProductLanguage[];
  translations?: Partial<Record<import("@/lib/types").ProductLanguage, import("@/lib/types").ProductTranslation>>;
};

export const storefrontProducts: StoreProduct[] = [
  {
    id: "store_iphone_17_pro",
    slug: "iphone-17-pro-256gb",
    name: "iPhone 17 Pro",
    category: "Smartfon",
    description: "A19 Pro chipi, professional kamera tizimi va premium unibody dizayn.",
    image: "/products/iphone-17-pro.webp",
    imageAlt: "Cosmic Orange rangidagi iPhone 17 Pro",
    video: {
      src: "/products/videos/iphone-17-pro-forged-plateau.mp4",
      poster: "/products/videos/iphone-17-pro-forged-plateau.webp",
      eyebrow: "iPhone 17 Pro film",
      title: "Titan kuch. Kinematik tafsilot.",
      sourceUrl: "https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/",
    },
    price: 20999000,
    compareAtPrice: 21999000,
    badge: "Yangi",
    stock: 18,
    rating: 4.9,
    reviews: 126,
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    specs: ["256GB", "A19 Pro", "48MP Pro Fusion", "6.3 dyuym"],
    featured: true,
  },
  {
    id: "store_iphone_17_pro_max",
    slug: "iphone-17-pro-max-512gb",
    name: "iPhone 17 Pro Max",
    category: "Smartfon",
    description: "Katta Pro displey, yuqori unumdorlik va uzoq ishlaydigan batareya.",
    image: "/products/iphone-17-pro.webp",
    imageAlt: "Cosmic Orange rangidagi iPhone 17 Pro Max",
    video: {
      src: "/products/videos/iphone-17-pro-camera-center-stage.mp4",
      poster: "/products/videos/iphone-17-pro-camera-center-stage.webp",
      eyebrow: "Center Stage camera",
      title: "Har bir kadr markazida siz.",
      sourceUrl: "https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/",
    },
    price: 26499000,
    badge: "Pro Max",
    stock: 7,
    rating: 4.9,
    reviews: 84,
    colors: ["Cosmic Orange", "Deep Blue", "Silver"],
    specs: ["512GB", "A19 Pro", "48MP Pro Fusion", "6.9 dyuym"],
    featured: false,
  },
  {
    id: "store_macbook_air_13",
    slug: "macbook-air-m5-13-512gb",
    name: "MacBook Air 13 M5",
    category: "Noutbuk",
    description: "Kundalik ish va ijod uchun jim, yengil va kuchli noutbuk.",
    image: "/products/macbook-air-m5.webp",
    imageAlt: "Sky Blue rangidagi MacBook Air 13 M5",
    price: 17999000,
    compareAtPrice: 18999000,
    badge: "M5",
    stock: 12,
    rating: 4.8,
    reviews: 97,
    colors: ["Sky Blue", "Midnight", "Silver", "Starlight"],
    specs: ["13.6 dyuym", "M5 chip", "16GB", "512GB SSD"],
    featured: true,
  },
  {
    id: "store_macbook_air_15",
    slug: "macbook-air-m5-15-512gb",
    name: "MacBook Air 15 M5",
    category: "Noutbuk",
    description: "Kattaroq Liquid Retina displey va butun kunlik mobil quvvat.",
    image: "/products/macbook-air-m5.webp",
    imageAlt: "Sky Blue rangidagi MacBook Air 15 M5",
    price: 21499000,
    badge: "15 dyuym",
    stock: 6,
    rating: 4.8,
    reviews: 61,
    colors: ["Sky Blue", "Midnight", "Silver", "Starlight"],
    specs: ["15.3 dyuym", "M5 chip", "16GB", "512GB SSD"],
    featured: false,
  },
  {
    id: "store_ipad_air_11",
    slug: "ipad-air-m4-11-256gb",
    name: "iPad Air 11 M4",
    category: "Planshet",
    description: "Ijod, o‘qish va ish uchun yupqa korpusdagi M4 unumdorligi.",
    image: "/products/ipad-air-m4.webp",
    imageAlt: "Blue rangidagi iPad Air 11 M4",
    price: 10999000,
    badge: "M4",
    stock: 9,
    rating: 4.8,
    reviews: 73,
    colors: ["Blue", "Purple", "Starlight", "Space Gray"],
    specs: ["11 dyuym", "M4 chip", "256GB", "Apple Pencil Pro"],
    featured: true,
  },
  {
    id: "store_ipad_air_13",
    slug: "ipad-air-m4-13-256gb",
    name: "iPad Air 13 M4",
    category: "Planshet",
    description: "Keng ekranli professional workflow uchun yengil planshet.",
    image: "/products/ipad-air-m4.webp",
    imageAlt: "Blue rangidagi iPad Air 13 M4",
    price: 13999000,
    stock: 4,
    rating: 4.7,
    reviews: 42,
    colors: ["Blue", "Purple", "Starlight", "Space Gray"],
    specs: ["13 dyuym", "M4 chip", "256GB", "Apple Pencil Pro"],
    featured: false,
  },
  {
    id: "store_airpods_pro_3",
    slug: "airpods-pro-3",
    name: "AirPods Pro 3",
    category: "Audio",
    description: "Kuchli shovqin bostirish, tiniq ovoz va qulay kundalik foydalanish.",
    image: "/products/airpods-pro-3.webp",
    imageAlt: "Oq rangdagi AirPods Pro 3 quloqchinlari",
    price: 3499000,
    compareAtPrice: 3799000,
    badge: "Pro",
    stock: 32,
    rating: 4.9,
    reviews: 214,
    colors: ["White"],
    specs: ["ANC", "USB-C", "Adaptive Audio", "MagSafe case"],
    featured: true,
  },
];

export const storeCategories: Array<{ value: StoreCategory; label: string; description: string; image: string }> = [
  { value: "Smartfon", label: "Smartfonlar", description: "Eng yangi Pro modellar", image: "/products/iphone-17-pro.webp" },
  { value: "Noutbuk", label: "Noutbuklar", description: "Ish va ijod uchun kuch", image: "/products/macbook-air-m5.webp" },
  { value: "Planshet", label: "Planshetlar", description: "Yengil va professional", image: "/products/ipad-air-m4.webp" },
  { value: "Audio", label: "Audio", description: "Tiniq va chuqur ovoz", image: "/products/airpods-pro-3.webp" },
  { value: "Aksessuar", label: "Aksessuarlar", description: "Qulay kundalik qo‘shimchalar", image: "/products/airpods-pro-3.webp" },
];

export const formatStoreMoney = (value: number) => `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} UZS`;

export function getStoreProduct(slug: string) {
  return storefrontProducts.find((product) => product.slug === slug);
}
