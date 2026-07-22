import { z } from "zod";

import type { StoreProduct } from "@/lib/storefront-data";
import type { Product, ProductLanguage, ProductTranslation } from "@/lib/types";

export const productStatusSchema = z.enum(["published", "draft", "archived"]);
export const productCategorySchema = z.enum(["Smartfon", "Noutbuk", "Audio", "Planshet", "Aksessuar"]);
export const languageSchema = z.enum(["UZ", "RU", "EN"]);
export const orderStatusSchema = z.enum(["new", "paid", "packing", "shipping", "completed", "cancelled"]);
export const paymentMethodSchema = z.enum(["cash", "card", "installment", "click", "payme"]);
export const orderChannelSchema = z.enum(["POS", "Online"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderChannel = z.infer<typeof orderChannelSchema>;

export type ProductMedia = {
  id: string;
  productId: string;
  variantId?: string;
  type: "image" | "video";
  url: string;
  mimeType?: string;
  altText: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  position: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  title: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  price: number;
  compareAtPrice?: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  status: "active" | "disabled";
  options: Record<string, string>;
  position: number;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CommerceProduct = Product & Omit<StoreProduct, "category" | "variants"> & {
  version: number;
  deletedAt?: string;
  reservedStock: number;
  availableStock: number;
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAt: string;
  updatedAt: string;
};

export type CommerceOrderItem = {
  productId: string;
  variantId?: string;
  variantTitle?: string;
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
  addressLatitude?: number;
  addressLongitude?: number;
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

function isSafeAssetUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const optionalUrl = z.string().trim().max(2048).refine((value) => value === "" || isSafeAssetUrl(value), "Faqat HTTP(S) URL yoki lokal path mumkin").optional();
const localOrRemoteAsset = z.string().trim().min(1).max(2048).refine(
  isSafeAssetUrl,
  "Rasm yoki video URL noto‘g‘ri",
);

export const productVariantInputSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  barcode: z.string().trim().min(3).max(80).optional(),
  costPrice: z.number().int().nonnegative(),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().default(0),
  status: z.enum(["active", "disabled"]).default("active"),
  options: z.record(z.string().trim().min(1).max(60), z.string().trim().min(1).max(100)).default({}),
  position: z.number().int().min(0).max(10_000).default(0),
  version: z.number().int().positive().optional(),
}).strict().superRefine((variant, context) => {
  if (variant.compareAtPrice !== undefined && variant.compareAtPrice < variant.price) {
    context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Eski narx sotuv narxidan kam bo‘lmasligi kerak" });
  }
});

export const productMediaInputSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  variantId: z.string().trim().min(1).max(80).optional(),
  type: z.enum(["image", "video"]).default("image"),
  url: localOrRemoteAsset,
  mimeType: z.string().trim().max(120).optional(),
  altText: z.string().trim().max(180).default(""),
  width: z.number().int().positive().max(20_000).optional(),
  height: z.number().int().positive().max(20_000).optional(),
  sizeBytes: z.number().int().nonnegative().max(50_000_000).optional(),
  position: z.number().int().min(0).max(10_000).default(0),
  isPrimary: z.boolean().default(false),
}).strict();

export const productTranslationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  imageAlt: z.string().trim().max(180).default(""),
  badge: z.string().trim().max(60).optional(),
  specs: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  videoTitle: z.string().trim().max(180).optional(),
  videoEyebrow: z.string().trim().max(100).optional(),
});

const productTranslationsSchema = z.object({
  UZ: productTranslationSchema.optional(),
  RU: productTranslationSchema.optional(),
  EN: productTranslationSchema.optional(),
}).refine((translations) => Object.values(translations).some(Boolean), "Kamida bitta til kontenti kiritilishi kerak");

const productInputObject = z.object({
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
  translations: productTranslationsSchema.optional(),
  description: z.string().trim().max(500).optional(),
  image: localOrRemoteAsset.optional(),
  imageAlt: z.string().trim().max(180).optional(),
  videoUrl: optionalUrl,
  videoPosterUrl: optionalUrl,
  variants: z.array(productVariantInputSchema).max(100).optional(),
  media: z.array(productMediaInputSchema).max(30).optional(),
}).strict();

export const createProductSchema = productInputObject.superRefine((product, context) => {
  if (product.compareAtPrice !== undefined && product.compareAtPrice < product.price) {
    context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Eski narx sotuv narxidan kam bo‘lmasligi kerak" });
  }
  if (product.costPrice > product.price) {
    context.addIssue({ code: "custom", path: ["costPrice"], message: "Kirim narxi sotuv narxidan yuqori" });
  }
  if (product.translations) {
    for (const locale of product.languages) {
      if (!product.translations[locale]) {
        context.addIssue({ code: "custom", path: ["translations", locale], message: `${locale} kontenti kiritilishi kerak` });
      }
    }
  }
  const variantSkus = product.variants?.map((variant) => variant.sku) ?? [];
  if (new Set(variantSkus).size !== variantSkus.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "Variant SKU qiymatlari takrorlanmasligi kerak" });
  }
  if ((product.media?.filter((media) => media.isPrimary && !media.variantId).length ?? 0) > 1) {
    context.addIssue({ code: "custom", path: ["media"], message: "Faqat bitta asosiy rasm tanlanishi mumkin" });
  }
});

export const updateProductSchema = productInputObject.partial().extend({
  stockDelta: z.number().int().optional(),
  version: z.number().int().positive().optional(),
}).superRefine((product, context) => {
  if (product.compareAtPrice !== undefined && product.price !== undefined && product.compareAtPrice < product.price) {
    context.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Eski narx sotuv narxidan kam bo‘lmasligi kerak" });
  }
  if (product.costPrice !== undefined && product.price !== undefined && product.costPrice > product.price) {
    context.addIssue({ code: "custom", path: ["costPrice"], message: "Kirim narxi sotuv narxidan yuqori" });
  }
  if (product.translations && product.languages) {
    for (const locale of product.languages) {
      if (!product.translations[locale]) {
        context.addIssue({ code: "custom", path: ["translations", locale], message: `${locale} kontenti kiritilishi kerak` });
      }
    }
  }
  const variantSkus = product.variants?.map((variant) => variant.sku) ?? [];
  if (new Set(variantSkus).size !== variantSkus.length) {
    context.addIssue({ code: "custom", path: ["variants"], message: "Variant SKU qiymatlari takrorlanmasligi kerak" });
  }
  if ((product.media?.filter((media) => media.isPrimary && !media.variantId).length ?? 0) > 1) {
    context.addIssue({ code: "custom", path: ["media"], message: "Faqat bitta asosiy rasm tanlanishi mumkin" });
  }
  if (product.stock !== undefined && product.stockDelta !== undefined) {
    context.addIssue({ code: "custom", path: ["stockDelta"], message: "stock va stockDelta bir vaqtda yuborilmaydi" });
  }
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  query: z.string().trim().max(120).default(""),
  status: productStatusSchema.optional(),
  category: productCategorySchema.optional(),
  sort: z.enum(["createdAt", "updatedAt", "name", "sku", "price", "stock", "sales"]).default("updatedAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  includeDeleted: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
}).strict();

export const bulkProductSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(80)).min(1).max(100).transform((ids) => [...new Set(ids)]),
  action: z.enum(["archive", "restore", "delete", "publish", "draft"]),
  versionById: z.record(z.string(), z.number().int().positive()).optional(),
}).strict();

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: orderStatusSchema.optional(),
  channel: orderChannelSchema.optional(),
  query: z.string().trim().max(120).default(""),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
}).strict().superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: "custom", path: ["from"], message: "Boshlanish sanasi tugash sanasidan keyin bo‘lmaydi" });
  }
});

export const createOrderSchema = z.object({
  customer: z.string().trim().max(120).default("Mehmon mijoz"),
  phone: z.string().trim().max(40).default(""),
  address: z.string().trim().max(240).default(""),
  addressLatitude: z.number().min(-90).max(90).optional(),
  addressLongitude: z.number().min(-180).max(180).optional(),
  channel: orderChannelSchema.default("Online"),
  payment: paymentMethodSchema.default("card"),
  discount: z.number().int().nonnegative().default(0),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1).max(80).optional(),
    quantity: z.number().int().positive().max(100),
  }).strict()).min(1).max(100),
}).superRefine((value, context) => {
  if (value.channel !== "Online") return;
  if (value.address.length < 5) context.addIssue({ code: "custom", path: ["address"], message: "Yetkazib berish manzilini tanlang" });
  if (value.addressLatitude === undefined || value.addressLongitude === undefined) {
    context.addIssue({ code: "custom", path: ["addressLatitude"], message: "Xaritadan yetkazib berish nuqtasini tanlang" });
  }
});

export const inventoryMovementSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().trim().min(1).max(80).optional(),
  quantity: z.number().int().refine((value) => value !== 0, "Miqdor 0 bo‘lmasligi kerak"),
  type: z.enum(["restock", "adjustment", "return", "damage"]).default("restock"),
  locationId: z.string().trim().min(1).max(80).default("loc_main"),
  location: z.string().trim().min(1).max(80).default("Asosiy ombor"),
  note: z.string().trim().max(240).default(""),
  referenceType: z.string().trim().min(1).max(80).optional(),
  referenceId: z.string().trim().min(1).max(120).optional(),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
}).strict();

export const inventoryReservationSchema = z.object({
  productId: z.string().trim().min(1).max(80),
  variantId: z.string().trim().min(1).max(80).optional(),
  quantity: z.number().int().positive().max(10_000),
  referenceType: z.string().trim().min(1).max(80),
  referenceId: z.string().trim().min(1).max(120),
  expiresAt: z.iso.datetime().optional(),
}).strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
export type InventoryReservationInput = z.infer<typeof inventoryReservationSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductMediaInput = z.infer<typeof productMediaInputSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type BulkProductInput = z.infer<typeof bulkProductSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type InventoryMovement = {
  id: number;
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  type: "restock" | "adjustment" | "return" | "sale" | "transfer" | "damage";
  quantity: number;
  location: string;
  note: string;
  balanceAfter?: number;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
};

export type InventoryReservation = {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  status: "active" | "released" | "committed" | "expired";
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: number;
  actorUserId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  requestId?: string;
  ipAddress?: string;
  createdAt: string;
};

export function localizeProduct<T extends {
  name: string;
  description: string;
  imageAlt: string;
  badge?: string;
  specs: string[];
  video?: StoreProduct["video"];
  translations?: Partial<Record<ProductLanguage, ProductTranslation>>;
}>(product: T, locale: ProductLanguage): T {
  const content = product.translations?.[locale] ?? product.translations?.UZ;
  if (!content) return product;
  return {
    ...product,
    name: content.name,
    description: content.description,
    imageAlt: content.imageAlt || product.imageAlt,
    badge: content.badge,
    specs: content.specs,
    video: product.video ? {
      ...product.video,
      title: content.videoTitle || product.video.title,
      eyebrow: content.videoEyebrow || product.video.eyebrow,
    } : product.video,
  };
}

export function toStorefrontProduct(product: CommerceProduct): StoreProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    description: product.description,
    image: product.image,
    imageAlt: product.imageAlt,
    video: product.video,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    badge: product.badge,
    stock: product.stock,
    reservedStock: product.reservedStock,
    availableStock: product.availableStock,
    rating: product.rating,
    reviews: product.reviews,
    colors: product.colors,
    specs: product.specs,
    featured: product.featured,
    languages: product.languages,
    translations: product.translations,
    variants: product.variants
      .filter((variant) => variant.status === "active")
      .map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        availableStock: variant.availableStock,
        status: variant.status,
        options: variant.options,
      })),
  };
}

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

export const reportRangeQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
}).strict().superRefine((value, context) => {
  if (!value.from || !value.to) return;
  const from = new Date(`${value.from}T00:00:00Z`);
  const to = new Date(`${value.to}T00:00:00Z`);
  if (from > to) context.addIssue({ code: "custom", path: ["from"], message: "Boshlanish sanasi tugash sanasidan keyin bo‘lmaydi" });
  if ((to.getTime() - from.getTime()) / 86_400_000 > 366) {
    context.addIssue({ code: "custom", path: ["to"], message: "Hisobot oralig‘i 366 kundan oshmasligi kerak" });
  }
});

export type SalesReport = {
  range: { from: string; to: string };
  summary: {
    revenue: number;
    grossProfit: number;
    orderCount: number;
    unitsSold: number;
    averageOrderValue: number;
    discountTotal: number;
    cancelledOrders: number;
  };
  daily: Array<{ date: string; revenue: number; grossProfit: number; orderCount: number; unitsSold: number }>;
  topProducts: Array<{ productId: string; name: string; sku: string; quantity: number; revenue: number; grossProfit: number }>;
  categories: Array<{ name: string; quantity: number; revenue: number }>;
  channels: Array<{ name: string; orderCount: number; revenue: number }>;
  payments: Array<{ name: string; orderCount: number; revenue: number }>;
  statuses: Array<{ name: string; orderCount: number; revenue: number }>;
};

export type InventoryReport = {
  generatedAt: string;
  summary: {
    productCount: number;
    variantCount: number;
    unitsOnHand: number;
    reservedUnits: number;
    availableUnits: number;
    inventoryCostValue: number;
    retailValue: number;
    potentialGrossProfit: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStock: Array<{
    productId: string;
    productName: string;
    sku: string;
    variantId?: string;
    variantTitle?: string;
    stock: number;
    reserved: number;
    available: number;
  }>;
};
