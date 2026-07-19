import { z } from "zod";

import type { StoreProduct } from "@/lib/storefront-data";
import type { Product } from "@/lib/types";

export const productStatusSchema = z.enum(["published", "draft", "archived"]);
export const productCategorySchema = z.enum(["Smartfon", "Noutbuk", "Audio", "Planshet", "Aksessuar"]);
export const languageSchema = z.enum(["UZ", "RU", "EN"]);
export const orderStatusSchema = z.enum(["new", "paid", "packing", "shipping", "completed", "cancelled"]);
export const paymentMethodSchema = z.enum(["cash", "card", "installment", "click", "payme"]);
export const orderChannelSchema = z.enum(["POS", "Online"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderChannel = z.infer<typeof orderChannelSchema>;

export type CommerceProduct = Product & Omit<StoreProduct, "category"> & {
  createdAt: string;
  updatedAt: string;
};

export type CommerceOrderItem = {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
};

export type CommerceOrder = {
  id: string;
  customer: string;
  phone: string;
  address: string;
  channel: OrderChannel;
  payment: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  userId?: string;
  createdAt: string;
  items: CommerceOrderItem[];
};

const optionalUrl = z.union([z.url(), z.literal("")]).optional();

const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  category: productCategorySchema,
  costPrice: z.number().int().nonnegative(),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative(),
  status: productStatusSchema,
  visibleOnStorefront: z.boolean(),
  languages: z.array(languageSchema).min(1),
  description: z.string().trim().max(500).optional(),
  image: z.string().trim().min(1).optional(),
  imageAlt: z.string().trim().max(180).optional(),
  videoUrl: optionalUrl,
  videoPosterUrl: optionalUrl,
});

export const createProductSchema = productInputSchema.extend({
  stock: productInputSchema.shape.stock.default(0),
  status: productInputSchema.shape.status.default("draft"),
  visibleOnStorefront: productInputSchema.shape.visibleOnStorefront.default(false),
  languages: productInputSchema.shape.languages.default(["UZ"]),
});

export const updateProductSchema = productInputSchema.partial().extend({
  stockDelta: z.number().int().optional(),
  addLanguage: languageSchema.optional(),
});

export const createOrderSchema = z.object({
  customer: z.string().trim().max(120).default("Mehmon mijoz"),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(240).default(""),
  channel: orderChannelSchema.default("Online"),
  payment: paymentMethodSchema.default("card"),
  discount: z.number().int().nonnegative().default(0),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().max(100),
  })).min(1),
});

export const inventoryMovementSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().refine((value) => value !== 0, "Miqdor 0 bo‘lmasligi kerak"),
  type: z.enum(["restock", "adjustment", "return"]).default("restock"),
  location: z.string().trim().min(1).max(80).default("Asosiy ombor"),
  note: z.string().trim().max(240).default(""),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;

export type InventoryMovement = {
  id: number;
  productId: string;
  productName: string;
  type: "restock" | "adjustment" | "return" | "sale";
  quantity: number;
  location: string;
  note: string;
  createdAt: string;
};

export type CommerceAnalytics = {
  revenue: number;
  profit: number;
  orderCount: number;
  unitsSold: number;
  lowStockCount: number;
  publishedProducts: number;
  categorySales: Array<{ name: string; value: number }>;
  recentOrders: CommerceOrder[];
};
