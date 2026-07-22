export type ProductStatus = "published" | "draft" | "archived";
export type ProductCategory = "Smartfon" | "Noutbuk" | "Audio" | "Planshet" | "Aksessuar";
export type ProductLanguage = "UZ" | "RU" | "EN";

export type ProductTranslation = {
  name: string;
  description: string;
  imageAlt: string;
  badge?: string;
  specs: string[];
  videoTitle?: string;
  videoEyebrow?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  description?: string;
  image?: string;
  imageAlt?: string;
  badge?: string;
  specs?: string[];
  costPrice: number;
  price: number;
  compareAtPrice?: number;
  videoUrl?: string;
  videoPosterUrl?: string;
  stock: number;
  status: ProductStatus;
  visibleOnStorefront: boolean;
  languages: ProductLanguage[];
  translations?: Partial<Record<ProductLanguage, ProductTranslation>>;
  sales: number;
};
