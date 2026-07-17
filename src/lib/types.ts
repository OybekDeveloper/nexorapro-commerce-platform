export type ProductStatus = "published" | "draft" | "archived";
export type ProductCategory = "Smartfon" | "Noutbuk" | "Audio" | "Planshet" | "Aksessuar";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  costPrice: number;
  price: number;
  compareAtPrice?: number;
  stock: number;
  status: ProductStatus;
  visibleOnStorefront: boolean;
  languages: Array<"UZ" | "RU" | "EN">;
  sales: number;
};
