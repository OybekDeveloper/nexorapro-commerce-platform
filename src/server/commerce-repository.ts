import "server-only";

import { randomUUID } from "node:crypto";

import type {
  CommerceAnalytics,
  AuditLog,
  CommerceOrder,
  CommerceOrderItem,
  CommerceProduct,
  BulkProductInput,
  CreateOrderInput,
  CreateProductInput,
  InventoryMovement,
  InventoryMovementInput,
  InventoryReservation,
  InventoryReservationInput,
  InventoryReport,
  OrderStatus,
  OrderListQuery,
  PaginationMeta,
  ProductListQuery,
  ProductMedia,
  ProductMediaInput,
  ProductVariant,
  ProductVariantInput,
  SalesReport,
  UpdateProductInput,
} from "@/lib/commerce";
import type { ProductCategory, ProductLanguage, ProductTranslation } from "@/lib/types";
import { database } from "@/server/database";
import { HttpError } from "@/server/http";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: ProductCategory;
  description: string;
  image: string;
  image_alt: string;
  cost_price: number;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: CommerceProduct["status"];
  visible_on_storefront: number;
  languages_json: string;
  sales: number;
  badge: string | null;
  rating: number;
  reviews: number;
  colors_json: string;
  specs_json: string;
  featured: number;
  video_url: string | null;
  video_poster_url: string | null;
  video_title: string | null;
  video_eyebrow: string | null;
  video_source_url: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  deleted_at: string | null;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  barcode: string | null;
  cost_price: number;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: ProductVariant["status"];
  options_json: string;
  position: number;
  version: number;
  created_at: string;
  updated_at: string;
};

type ProductMediaRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_type: ProductMedia["type"];
  url: string;
  mime_type: string | null;
  alt_text: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  position: number;
  is_primary: number;
  created_at: string;
  updated_at: string;
};

export type MutationContext = {
  actorUserId?: string;
  requestId?: string;
  ipAddress?: string;
};

type ProductTranslationRow = {
  product_id: string;
  locale: ProductLanguage;
  name: string;
  description: string;
  image_alt: string;
  badge: string | null;
  specs_json: string;
  video_title: string | null;
  video_eyebrow: string | null;
};

type OrderRow = Omit<CommerceOrder, "items" | "createdAt" | "userId" | "addressLatitude" | "addressLongitude"> & {
  created_at: string;
  user_id: string | null;
  address_lat: number | null;
  address_lng: number | null;
};

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseStringRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  } catch {
    return {};
  }
}

function mapVariant(row: ProductVariantRow, reservedStock = 0): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    title: row.title,
    sku: row.sku,
    barcode: row.barcode ?? undefined,
    costPrice: row.cost_price,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    stock: row.stock,
    reservedStock,
    availableStock: Math.max(0, row.stock - reservedStock),
    status: row.status,
    options: parseStringRecord(row.options_json),
    position: row.position,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMedia(row: ProductMediaRow): ProductMedia {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id ?? undefined,
    type: row.media_type,
    url: row.url,
    mimeType: row.mime_type ?? undefined,
    altText: row.alt_text,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sizeBytes: row.size_bytes ?? undefined,
    position: row.position,
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTranslation(row: ProductTranslationRow): ProductTranslation {
  return {
    name: row.name,
    description: row.description,
    imageAlt: row.image_alt,
    badge: row.badge ?? undefined,
    specs: parseStringArray(row.specs_json),
    videoTitle: row.video_title ?? undefined,
    videoEyebrow: row.video_eyebrow ?? undefined,
  };
}

function getProductTranslations(productIds: string[]) {
  const translations = new Map<string, Partial<Record<ProductLanguage, ProductTranslation>>>();
  if (productIds.length === 0) return translations;
  const placeholders = productIds.map(() => "?").join(",");
  const rows = database.prepare(`
    SELECT product_id, locale, name, description, image_alt, badge, specs_json, video_title, video_eyebrow
    FROM product_translations WHERE product_id IN (${placeholders}) ORDER BY locale
  `).all(...productIds) as ProductTranslationRow[];
  for (const row of rows) {
    const values = translations.get(row.product_id) ?? {};
    values[row.locale] = mapTranslation(row);
    translations.set(row.product_id, values);
  }
  return translations;
}

function getProductRelations(productIds: string[]) {
  const variants = new Map<string, ProductVariant[]>();
  const media = new Map<string, ProductMedia[]>();
  const reservedByUnit = new Map<string, number>();
  const reservedByProduct = new Map<string, number>();
  if (productIds.length === 0) return { variants, media, reservedByUnit, reservedByProduct };
  const placeholders = productIds.map(() => "?").join(",");
  const reservationRows = database.prepare(`
    SELECT product_id, variant_id, COALESCE(SUM(quantity), 0) AS quantity
    FROM inventory_reservations
    WHERE product_id IN (${placeholders}) AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)
    GROUP BY product_id, variant_id
  `).all(...productIds) as Array<{ product_id: string; variant_id: string | null; quantity: number }>;
  for (const row of reservationRows) {
    reservedByUnit.set(`${row.product_id}:${row.variant_id ?? ""}`, row.quantity);
    reservedByProduct.set(row.product_id, (reservedByProduct.get(row.product_id) ?? 0) + row.quantity);
  }
  const variantRows = database.prepare(`
    SELECT * FROM product_variants
    WHERE product_id IN (${placeholders}) AND deleted_at IS NULL
    ORDER BY product_id, position, created_at
  `).all(...productIds) as ProductVariantRow[];
  for (const row of variantRows) {
    const group = variants.get(row.product_id) ?? [];
    group.push(mapVariant(row, reservedByUnit.get(`${row.product_id}:${row.id}`) ?? 0));
    variants.set(row.product_id, group);
  }
  const mediaRows = database.prepare(`
    SELECT * FROM product_media
    WHERE product_id IN (${placeholders})
    ORDER BY product_id, is_primary DESC, position, created_at
  `).all(...productIds) as ProductMediaRow[];
  for (const row of mediaRows) {
    const group = media.get(row.product_id) ?? [];
    group.push(mapMedia(row));
    media.set(row.product_id, group);
  }
  return { variants, media, reservedByUnit, reservedByProduct };
}

function mapProduct(
  row: ProductRow,
  translations: Partial<Record<ProductLanguage, ProductTranslation>> = {},
  variants: ProductVariant[] = [],
  media: ProductMedia[] = [],
  reservedStock = 0,
): CommerceProduct {
  const normalizedTranslations = Object.keys(translations).length > 0 ? translations : {
    UZ: {
      name: row.name,
      description: row.description,
      imageAlt: row.image_alt,
      badge: row.badge ?? undefined,
      specs: parseStringArray(row.specs_json),
      videoTitle: row.video_title ?? undefined,
      videoEyebrow: row.video_eyebrow ?? undefined,
    },
  };
  const video = row.video_url ? {
    src: row.video_url,
    poster: row.video_poster_url ?? row.image,
    title: row.video_title ?? row.name,
    eyebrow: row.video_eyebrow ?? "Mahsulot videosi",
    sourceUrl: row.video_source_url ?? row.video_url,
  } : undefined;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description,
    image: row.image,
    imageAlt: row.image_alt,
    video,
    videoUrl: row.video_url ?? undefined,
    videoPosterUrl: row.video_poster_url ?? undefined,
    costPrice: row.cost_price,
    price: row.price,
    compareAtPrice: row.compare_at_price ?? undefined,
    stock: row.stock,
    reservedStock,
    availableStock: Math.max(0, row.stock - reservedStock),
    status: row.status,
    visibleOnStorefront: Boolean(row.visible_on_storefront),
    languages: Object.keys(normalizedTranslations) as ProductLanguage[],
    translations: normalizedTranslations,
    sales: row.sales,
    badge: row.badge ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    colors: parseStringArray(row.colors_json),
    specs: parseStringArray(row.specs_json),
    featured: Boolean(row.featured),
    version: row.version,
    deletedAt: row.deleted_at ?? undefined,
    variants,
    media,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getOrderItems(orderId: string): CommerceOrderItem[] {
  return database.prepare(`
    SELECT product_id AS productId, variant_id AS variantId, variant_title AS variantTitle,
      product_name AS productName, sku, price, quantity
    FROM order_items WHERE order_id = ? ORDER BY id
  `).all(orderId) as CommerceOrderItem[];
}

function mapOrder(row: OrderRow, items = getOrderItems(row.id)): CommerceOrder {
  const { created_at, user_id, address_lat, address_lng, ...order } = row;
  return {
    ...order,
    userId: user_id ?? undefined,
    addressLatitude: address_lat ?? undefined,
    addressLongitude: address_lng ?? undefined,
    createdAt: created_at,
    items,
  };
}

function mapOrders(rows: OrderRow[]) {
  if (rows.length === 0) return [];
  const placeholders = rows.map(() => "?").join(",");
  const items = database.prepare(`
    SELECT order_id AS orderId, product_id AS productId, variant_id AS variantId,
      variant_title AS variantTitle, product_name AS productName, sku, price, quantity
    FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id
  `).all(...rows.map((row) => row.id)) as Array<CommerceOrderItem & { orderId: string }>;
  const byOrder = new Map<string, CommerceOrderItem[]>();
  for (const { orderId, ...item } of items) {
    const group = byOrder.get(orderId) ?? [];
    group.push(item);
    byOrder.set(orderId, group);
  }
  return rows.map((row) => mapOrder(row, byOrder.get(row.id) ?? []));
}

export function listProducts(options: { storefrontOnly?: boolean; includeDeleted?: boolean; limit?: number } = {}) {
  const deletedClause = options.includeDeleted ? "" : "deleted_at IS NULL AND ";
  const limitClause = options.limit ? ` LIMIT ${Math.max(1, Math.min(500, Math.trunc(options.limit)))}` : "";
  const query = options.storefrontOnly
    ? `SELECT * FROM products WHERE ${deletedClause}visible_on_storefront = 1 AND status = 'published' ORDER BY featured DESC, created_at ASC${limitClause}`
    : `SELECT * FROM products ${deletedClause ? `WHERE ${deletedClause.slice(0, -5)}` : ""} ORDER BY updated_at DESC, name ASC${limitClause}`;
  const rows = database.prepare(query).all() as ProductRow[];
  const translations = getProductTranslations(rows.map((row) => row.id));
  const relations = getProductRelations(rows.map((row) => row.id));
  return rows.map((row) => mapProduct(
    row,
    translations.get(row.id),
    relations.variants.get(row.id),
    relations.media.get(row.id),
    relations.reservedByProduct.get(row.id) ?? 0,
  ));
}

/** Dashboard low-stock card: avoids hydrating the whole catalog for four columns. */
export function listLowStockProducts(threshold = 5) {
  return database.prepare(`
    SELECT id, name, sku, stock FROM products
    WHERE deleted_at IS NULL AND stock <= ?
    ORDER BY updated_at DESC, name ASC
  `).all(threshold) as Array<{ id: string; name: string; sku: string; stock: number }>;
}

export function getProduct(idOrSlug: string, options: { includeDeleted?: boolean } = {}) {
  const row = database.prepare(`
    SELECT * FROM products
    WHERE (id = ? OR slug = ?) ${options.includeDeleted ? "" : "AND deleted_at IS NULL"}
  `).get(idOrSlug, idOrSlug) as ProductRow | undefined;
  if (!row) return null;
  const relations = getProductRelations([row.id]);
  const reservedStock = relations.reservedByProduct.get(row.id) ?? 0;
  return mapProduct(row, getProductTranslations([row.id]).get(row.id), relations.variants.get(row.id), relations.media.get(row.id), reservedStock);
}

export function getProductBySku(sku: string, options: { includeDeleted?: boolean } = {}) {
  const row = database.prepare(`SELECT id FROM products WHERE sku = ? ${options.includeDeleted ? "" : "AND deleted_at IS NULL"}`).get(sku) as { id: string } | undefined;
  return row ? getProduct(row.id, options) : null;
}

const productSortColumns: Record<ProductListQuery["sort"], string> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  name: "name COLLATE NOCASE",
  sku: "sku COLLATE NOCASE",
  price: "price",
  stock: "stock",
  sales: "sales",
};

export function listProductsPage(input: ProductListQuery) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (!input.includeDeleted) conditions.push("deleted_at IS NULL");
  if (input.status) {
    conditions.push("status = ?");
    values.push(input.status);
  }
  if (input.category) {
    conditions.push("category = ?");
    values.push(input.category);
  }
  if (input.query) {
    conditions.push("(name LIKE ? ESCAPE '\\' COLLATE NOCASE OR sku LIKE ? ESCAPE '\\' COLLATE NOCASE OR slug LIKE ? ESCAPE '\\' COLLATE NOCASE)");
    const escaped = input.query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
    values.push(`%${escaped}%`, `%${escaped}%`, `%${escaped}%`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM products ${where}`).get(...values) as { count: number }).count;
  const offset = (input.page - 1) * input.pageSize;
  const rows = database.prepare(`
    SELECT * FROM products ${where}
    ORDER BY ${productSortColumns[input.sort]} ${input.direction.toUpperCase()}, id ASC
    LIMIT ? OFFSET ?
  `).all(...values, input.pageSize, offset) as ProductRow[];
  const translations = getProductTranslations(rows.map((row) => row.id));
  const relations = getProductRelations(rows.map((row) => row.id));
  const products = rows.map((row) => mapProduct(
    row,
    translations.get(row.id),
    relations.variants.get(row.id),
    relations.media.get(row.id),
    relations.reservedByProduct.get(row.id) ?? 0,
  ));
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));
  const pagination: PaginationMeta = {
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages,
    hasNextPage: input.page < totalPages,
    hasPreviousPage: input.page > 1,
  };
  return { products, pagination };
}

function uniqueSlug(name: string, excludedId?: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mahsulot";
  let slug = base;
  let suffix = 2;
  const exists = database.prepare("SELECT id FROM products WHERE slug = ? AND id != COALESCE(?, '')");
  while (exists.get(slug, excludedId)) slug = `${base}-${suffix++}`;
  return slug;
}

function fallbackTranslation(input: Pick<CreateProductInput, "name" | "description" | "imageAlt">): ProductTranslation {
  return {
    name: input.name,
    description: input.description ?? `${input.name} — nexorapro.uz katalogidagi yangi mahsulot.`,
    imageAlt: input.imageAlt ?? input.name,
    specs: [],
  };
}

const upsertTranslation = database.prepare(`
  INSERT INTO product_translations (
    product_id, locale, name, description, image_alt, badge, specs_json, video_title, video_eyebrow
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(product_id, locale) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    image_alt = excluded.image_alt,
    badge = excluded.badge,
    specs_json = excluded.specs_json,
    video_title = excluded.video_title,
    video_eyebrow = excluded.video_eyebrow,
    updated_at = CURRENT_TIMESTAMP
`);

function saveTranslations(productId: string, translations: Partial<Record<ProductLanguage, ProductTranslation>>) {
  for (const locale of ["UZ", "RU", "EN"] as const) {
    const content = translations[locale];
    if (!content) continue;
    upsertTranslation.run(
      productId,
      locale,
      content.name,
      content.description,
      content.imageAlt,
      content.badge || null,
      JSON.stringify(content.specs),
      content.videoTitle || null,
      content.videoEyebrow || null,
    );
  }
  const rows = database.prepare("SELECT locale FROM product_translations WHERE product_id = ? ORDER BY locale").all(productId) as Array<{ locale: ProductLanguage }>;
  database.prepare("UPDATE products SET languages_json = ? WHERE id = ?").run(JSON.stringify(rows.map(({ locale }) => locale)), productId);
}

function saveVariants(productId: string, variants: ProductVariantInput[]) {
  const currentRows = database.prepare("SELECT id FROM product_variants WHERE product_id = ? AND deleted_at IS NULL").all(productId) as Array<{ id: string }>;
  const retained = new Set<string>();
  const upsert = database.prepare(`
    INSERT INTO product_variants (
      id, product_id, title, sku, barcode, cost_price, price, compare_at_price,
      stock, status, options_json, position
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      sku = excluded.sku,
      barcode = excluded.barcode,
      cost_price = excluded.cost_price,
      price = excluded.price,
      compare_at_price = excluded.compare_at_price,
      stock = excluded.stock,
      status = excluded.status,
      options_json = excluded.options_json,
      position = excluded.position,
      version = product_variants.version + 1,
      deleted_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  `);
  for (const [index, variant] of variants.entries()) {
    const id = variant.id ?? `var_${randomUUID().slice(0, 12)}`;
    retained.add(id);
    upsert.run(
      id,
      productId,
      variant.title,
      variant.sku,
      variant.barcode || null,
      variant.costPrice,
      variant.price,
      variant.compareAtPrice ?? null,
      variant.stock,
      variant.status,
      JSON.stringify(variant.options),
      variant.position ?? index,
    );
  }
  const archive = database.prepare("UPDATE product_variants SET deleted_at = CURRENT_TIMESTAMP, status = 'disabled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND product_id = ?");
  for (const row of currentRows) if (!retained.has(row.id)) archive.run(row.id, productId);
}

function saveMedia(productId: string, media: ProductMediaInput[]) {
  const variantRows = database.prepare("SELECT id FROM product_variants WHERE product_id = ? AND deleted_at IS NULL").all(productId) as Array<{ id: string }>;
  const allowedVariants = new Set(variantRows.map(({ id }) => id));
  for (const item of media) {
    if (item.variantId && !allowedVariants.has(item.variantId)) {
      throw new HttpError(422, `${item.variantId}: media varianti mahsulotga tegishli emas`, "VALIDATION_ERROR");
    }
  }
  database.prepare("DELETE FROM product_media WHERE product_id = ?").run(productId);
  const insert = database.prepare(`
    INSERT INTO product_media (
      id, product_id, variant_id, media_type, url, mime_type, alt_text,
      width, height, size_bytes, position, is_primary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const [index, item] of media.entries()) {
    insert.run(
      item.id ?? `med_${randomUUID().slice(0, 12)}`,
      productId,
      item.variantId ?? null,
      item.type,
      item.url,
      item.mimeType ?? null,
      item.altText,
      item.width ?? null,
      item.height ?? null,
      item.sizeBytes ?? null,
      item.position ?? index,
      Number(item.isPrimary),
    );
  }
}

function writeAudit(
  context: MutationContext,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  database.prepare(`
    INSERT INTO audit_logs (
      actor_user_id, action, entity_type, entity_id, before_json, after_json, request_id, ip_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    context.actorUserId ?? null,
    action,
    entityType,
    entityId,
    before === undefined ? null : JSON.stringify(before),
    after === undefined ? null : JSON.stringify(after),
    context.requestId ?? null,
    context.ipAddress ?? null,
  );
}

function normalizedProductStock(input: Pick<CreateProductInput, "stock" | "variants">) {
  return input.variants && input.variants.length > 0
    ? input.variants.reduce((sum, variant) => sum + variant.stock, 0)
    : input.stock;
}

export function createProduct(input: CreateProductInput, context: MutationContext = {}) {
  return database.transaction(() => {
    const id = `prd_${randomUUID().slice(0, 12)}`;
    const translations = input.translations ?? { UZ: fallbackTranslation(input) };
    const primary = translations.UZ ?? translations.RU ?? translations.EN ?? fallbackTranslation(input);
    const slug = uniqueSlug(primary.name);
    const visible = input.status === "published" && input.visibleOnStorefront;
    const stock = normalizedProductStock(input);
    const primaryMedia = input.media?.find((item) => item.isPrimary && item.type === "image") ?? input.media?.find((item) => item.type === "image");
    database.prepare(`
      INSERT INTO products (
        id, slug, name, sku, category, description, image, image_alt, cost_price, price,
        compare_at_price, stock, status, visible_on_storefront, languages_json, video_url,
        video_poster_url, badge, colors_json, specs_json, video_title, video_eyebrow
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)
    `).run(
      id, slug, primary.name, input.sku, input.category, primary.description,
      primaryMedia?.url ?? input.image ?? "/products/iphone-17-pro.webp", primary.imageAlt,
      input.costPrice, input.price, input.compareAtPrice ?? null, stock,
      input.status, Number(visible), JSON.stringify(Object.keys(translations)),
      input.videoUrl || null, input.videoPosterUrl || null, primary.badge || null,
      JSON.stringify(primary.specs), primary.videoTitle || null, primary.videoEyebrow || null,
    );
    saveTranslations(id, translations);
    if (input.variants) saveVariants(id, input.variants);
    if (input.media) saveMedia(id, input.media);
    if (stock !== input.stock) database.prepare("UPDATE products SET stock = ? WHERE id = ?").run(stock, id);
    if (stock > 0) {
      database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, location_id, balance_after, note, actor_user_id) VALUES (?, 'restock', ?, 'loc_main', ?, 'Boshlang‘ich qoldiq', ?)").run(id, stock, stock, context.actorUserId ?? null);
    }
    const product = getProduct(id)!;
    writeAudit(context, "product.create", "product", id, undefined, product);
    return product;
  })();
}

export function updateProduct(id: string, input: UpdateProductInput, context: MutationContext = {}) {
  return database.transaction(() => {
    const current = getProduct(id);
    if (!current) return null;
    if (input.version !== undefined && input.version !== current.version) {
      throw new HttpError(409, "Mahsulot boshqa foydalanuvchi tomonidan yangilangan. Sahifani yangilang", "VERSION_CONFLICT", {
        currentVersion: current.version,
        suppliedVersion: input.version,
      });
    }
    const translations = { ...(current.translations ?? {}), ...input.translations };
    const primary = translations.UZ ?? translations.RU ?? translations.EN;
    const next = {
      ...current,
      ...input,
      name: primary?.name ?? input.name ?? current.name,
      description: primary?.description ?? input.description ?? current.description,
      imageAlt: primary?.imageAlt ?? input.imageAlt ?? current.imageAlt,
      badge: primary?.badge,
      specs: primary?.specs ?? current.specs,
      image: input.media?.find((item) => item.isPrimary && item.type === "image")?.url
        ?? input.media?.find((item) => item.type === "image")?.url
        ?? input.image
        ?? current.image,
      slug: uniqueSlug(primary?.name ?? input.name ?? current.name, id),
      languages: Object.keys(translations) as ProductLanguage[],
    };
    if (input.stock !== undefined && input.stockDelta !== undefined) {
      throw new HttpError(422, "stock va stockDelta bir vaqtda yuborilmaydi", "VALIDATION_ERROR");
    }
    const adjustedStock = Math.max(0, current.stock + (input.stockDelta ?? 0));
    const nextVariants = input.variants ?? current.variants;
    const variantStock = nextVariants.length > 0 ? nextVariants.reduce((sum, variant) => sum + variant.stock, 0) : undefined;
    const nextStock = variantStock ?? input.stock ?? adjustedStock;
    const visible = next.status === "published" && next.visibleOnStorefront;
    const result = database.prepare(`
      UPDATE products SET slug = ?, name = ?, sku = ?, category = ?, description = ?, image = ?,
        image_alt = ?, cost_price = ?, price = ?, compare_at_price = ?, stock = ?, status = ?,
        visible_on_storefront = ?, languages_json = ?, video_url = ?, video_poster_url = ?,
        badge = ?, specs_json = ?, video_title = ?, video_eyebrow = ?,
        version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?
    `).run(
      next.slug, next.name, next.sku, next.category, next.description, next.image, next.imageAlt,
      next.costPrice, next.price, next.compareAtPrice ?? null, nextStock, next.status,
      Number(visible), JSON.stringify(next.languages), next.videoUrl || null,
      next.videoPosterUrl || null, next.badge || null, JSON.stringify(next.specs),
      primary?.videoTitle || next.video?.title || null,
      primary?.videoEyebrow || next.video?.eyebrow || null,
      id, current.version,
    );
    if (result.changes !== 1) throw new HttpError(409, "Mahsulot versiyasi o‘zgardi. Qayta urinib ko‘ring", "VERSION_CONFLICT");
    if (input.translations) saveTranslations(id, input.translations);
    if (input.variants) saveVariants(id, input.variants);
    if (input.media) saveMedia(id, input.media);
    if (input.stockDelta) {
      database.prepare("INSERT INTO inventory_movements (product_id, type, quantity, location_id, balance_after, note, actor_user_id) VALUES (?, 'adjustment', ?, 'loc_main', ?, 'Mahsulot kartasidan qoldiq yangilandi', ?)").run(id, input.stockDelta, nextStock, context.actorUserId ?? null);
    }
    const product = getProduct(id)!;
    writeAudit(context, "product.update", "product", id, current, product);
    return product;
  })();
}

export function archiveProduct(id: string, context: MutationContext = {}) {
  return database.transaction(() => {
    const before = getProduct(id);
    if (!before) return null;
    database.prepare("UPDATE products SET status = 'archived', visible_on_storefront = 0, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL").run(id);
    const product = getProduct(id)!;
    writeAudit(context, "product.archive", "product", id, before, product);
    return product;
  })();
}

export function deleteProduct(id: string, context: MutationContext = {}) {
  return database.transaction(() => {
    const before = getProduct(id);
    if (!before) return null;
    database.prepare(`
      UPDATE products SET status = 'archived', visible_on_storefront = 0,
        deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, version = version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL
    `).run(context.actorUserId ?? null, id);
    const product = getProduct(id, { includeDeleted: true })!;
    writeAudit(context, "product.delete", "product", id, before, product);
    return product;
  })();
}

export function bulkMutateProducts(input: BulkProductInput, context: MutationContext = {}) {
  return database.transaction(() => {
    const products: CommerceProduct[] = [];
    for (const id of input.ids) {
      const current = getProduct(id, { includeDeleted: true });
      if (!current) throw new HttpError(404, `${id}: mahsulot topilmadi`);
      const expectedVersion = input.versionById?.[id];
      if (expectedVersion !== undefined && expectedVersion !== current.version) {
        throw new HttpError(409, `${current.name}: versiya o‘zgargan`, "VERSION_CONFLICT", { id, currentVersion: current.version });
      }
      if (current.deletedAt && input.action !== "restore") {
        throw new HttpError(409, `${current.name}: o‘chirilgan mahsulot uchun faqat restore amali mumkin`);
      }
      let sql: string;
      let action: string;
      if (input.action === "delete") {
        sql = "UPDATE products SET status = 'archived', visible_on_storefront = 0, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        database.prepare(sql).run(context.actorUserId ?? null, id);
        action = "product.delete";
      } else if (input.action === "restore") {
        sql = "UPDATE products SET status = 'draft', visible_on_storefront = 0, deleted_at = NULL, deleted_by = NULL, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        database.prepare(sql).run(id);
        action = "product.restore";
      } else {
        const nextStatus = input.action === "publish" ? "published" : input.action === "draft" ? "draft" : "archived";
        const visible = input.action === "publish" ? current.visibleOnStorefront : false;
        database.prepare("UPDATE products SET status = ?, visible_on_storefront = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL").run(nextStatus, Number(visible), id);
        action = `product.${input.action}`;
      }
      const after = getProduct(id, { includeDeleted: true })!;
      writeAudit(context, action, "product", id, current, after);
      products.push(after);
    }
    return products;
  })();
}

export function importProductBatch(
  inputs: CreateProductInput[],
  mode: "create" | "upsert",
  context: MutationContext = {},
) {
  return database.transaction(() => {
    const products: CommerceProduct[] = [];
    let created = 0;
    let updated = 0;
    for (const input of inputs) {
      const existing = getProductBySku(input.sku, { includeDeleted: true });
      if (existing && mode === "create") {
        throw new HttpError(409, `${input.sku}: SKU avvaldan mavjud`);
      }
      if (existing) {
        if (existing.deletedAt) {
          database.prepare("UPDATE products SET deleted_at = NULL, deleted_by = NULL WHERE id = ?").run(existing.id);
        }
        const product = updateProduct(existing.id, { ...input, version: existing.version }, context);
        if (!product) throw new HttpError(404, `${input.sku}: mahsulot topilmadi`);
        products.push(product);
        updated += 1;
      } else {
        products.push(createProduct(input, context));
        created += 1;
      }
    }
    return { products, created, updated };
  })();
}

export function listOrders(options: { limit?: number } = {}) {
  const limit = options.limit ? ` LIMIT ${Math.max(1, Math.min(500, Math.trunc(options.limit)))}` : "";
  const rows = database.prepare(`SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders ORDER BY created_at DESC, sequence DESC${limit}`).all() as OrderRow[];
  return mapOrders(rows);
}

export function listOrdersPage(input: OrderListQuery) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (input.status) { conditions.push("status = ?"); values.push(input.status); }
  if (input.channel) { conditions.push("channel = ?"); values.push(input.channel); }
  if (input.query) {
    const escaped = input.query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
    conditions.push("(id LIKE ? ESCAPE '\\' COLLATE NOCASE OR customer LIKE ? ESCAPE '\\' COLLATE NOCASE OR phone LIKE ? ESCAPE '\\' COLLATE NOCASE)");
    values.push(`%${escaped}%`, `%${escaped}%`, `%${escaped}%`);
  }
  if (input.from) { conditions.push("created_at >= datetime(?)"); values.push(input.from); }
  if (input.to) { conditions.push("created_at < datetime(?, '+1 day')"); values.push(input.to); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM orders ${where}`).get(...values) as { count: number }).count;
  const rows = database.prepare(`
    SELECT id, customer, phone, address, address_lat, address_lng, channel, payment,
      status, subtotal, discount, total, user_id, created_at
    FROM orders ${where}
    ORDER BY created_at DESC, sequence DESC LIMIT ? OFFSET ?
  `).all(...values, input.pageSize, (input.page - 1) * input.pageSize) as OrderRow[];
  const totalPages = Math.max(1, Math.ceil(total / input.pageSize));
  const pagination: PaginationMeta = {
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages,
    hasNextPage: input.page < totalPages,
    hasPreviousPage: input.page > 1,
  };
  return { orders: mapOrders(rows), pagination };
}

export function listOrdersByUser(userId: string) {
  const rows = database.prepare("SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC, sequence DESC").all(userId) as OrderRow[];
  return mapOrders(rows);
}

export function getOrder(id: string) {
  const row = database.prepare("SELECT id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id, created_at FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  return row ? mapOrder(row) : null;
}

export function createOrder(input: CreateOrderInput, userId?: string, context: MutationContext = {}) {
  return database.transaction(() => {
    const requested = new Map<string, { productId: string; variantId?: string; quantity: number }>();
    for (const item of input.items) {
      const key = `${item.productId}:${item.variantId ?? ""}`;
      const current = requested.get(key);
      requested.set(key, { ...item, quantity: (current?.quantity ?? 0) + item.quantity });
    }
    const productIds = [...new Set([...requested.values()].map(({ productId }) => productId))];
    const placeholders = productIds.map(() => "?").join(",");
    type OrderProduct = Pick<ProductRow, "id" | "name" | "sku" | "cost_price" | "price" | "stock" | "status" | "deleted_at"> & { has_variants: number };
    type OrderVariant = Pick<ProductVariantRow, "id" | "product_id" | "title" | "sku" | "cost_price" | "price" | "stock" | "status"> & { deleted_at: string | null };
    const productRows = database.prepare(`
      SELECT p.id, p.name, p.sku, p.cost_price, p.price, p.stock, p.status, p.deleted_at,
        EXISTS(
          SELECT 1 FROM product_variants v
          WHERE v.product_id = p.id AND v.deleted_at IS NULL AND v.status = 'active'
        ) AS has_variants
      FROM products p WHERE p.id IN (${placeholders})
    `).all(...productIds) as OrderProduct[];
    const productMap = new Map(productRows.filter((row) => row.deleted_at === null).map((row) => [row.id, row]));
    const variantIds = [...new Set([...requested.values()].flatMap(({ variantId }) => variantId ? [variantId] : []))];
    const variantMap = new Map<string, OrderVariant>();
    if (variantIds.length > 0) {
      const variantPlaceholders = variantIds.map(() => "?").join(",");
      const variantRows = database.prepare(`
        SELECT id, product_id, title, sku, cost_price, price, stock, status, deleted_at
        FROM product_variants WHERE id IN (${variantPlaceholders})
      `).all(...variantIds) as OrderVariant[];
      for (const variant of variantRows) if (variant.deleted_at === null) variantMap.set(variant.id, variant);
    }
    const reservationRows = database.prepare(`
      SELECT product_id, variant_id, COALESCE(SUM(quantity), 0) AS quantity
      FROM inventory_reservations
      WHERE product_id IN (${placeholders}) AND status = 'active'
        AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)
      GROUP BY product_id, variant_id
    `).all(...productIds) as Array<{ product_id: string; variant_id: string | null; quantity: number }>;
    const reservedByUnit = new Map(reservationRows.map((row) => [`${row.product_id}:${row.variant_id ?? ""}`, row.quantity]));
    const lines = [...requested.values()].map(({ productId, variantId, quantity }) => {
      const product = productMap.get(productId);
      if (!product || product.status !== "published") throw new HttpError(409, "Mahsulot sotuv uchun mavjud emas");
      if (product.has_variants && !variantId) {
        throw new HttpError(422, `${product.name}: mahsulot variantini tanlang`, "VARIANT_REQUIRED", { productId: product.id });
      }
      const variant = variantId ? variantMap.get(variantId) : undefined;
      if (variant && variant.product_id !== product.id) throw new HttpError(409, `${product.name}: variant boshqa mahsulotga tegishli`);
      if (variantId && !variant) throw new HttpError(409, `${product.name}: variant sotuv uchun mavjud emas`);
      if (variant?.status !== undefined && variant.status !== "active") throw new HttpError(409, `${product.name}: variant o‘chirilgan`);
      const stock = variant?.stock ?? product.stock;
      const reserved = reservedByUnit.get(`${product.id}:${variant?.id ?? ""}`) ?? 0;
      const available = stock - reserved;
      if (available < quantity) throw new HttpError(409, `${product.name}${variant ? ` (${variant.title})` : ""}: sotuv uchun faqat ${available} dona mavjud`, "INSUFFICIENT_AVAILABLE_STOCK", { stock, reserved, available });
      return { product, variant, quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + (line.variant?.price ?? line.product.price) * line.quantity, 0);
    const discount = Math.min(subtotal, input.discount);
    const total = subtotal - discount;
    const latest = database.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(id, 5) AS INTEGER)), 1000) AS value FROM orders").get() as { value: number };
    const id = `#NX-${latest.value + 1}`;
    database.prepare(`
      INSERT INTO orders (id, customer, phone, address, address_lat, address_lng, channel, payment, status, subtotal, discount, total, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.customer || "Mehmon mijoz",
      input.phone,
      input.address,
      input.addressLatitude ?? null,
      input.addressLongitude ?? null,
      input.channel,
      input.payment,
      input.channel === "POS" ? "paid" : "new",
      subtotal,
      discount,
      total,
      userId ?? null,
    );
    const insertItem = database.prepare("INSERT INTO order_items (order_id, product_id, variant_id, variant_title, product_name, sku, cost_price, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const updateStock = database.prepare("UPDATE products SET stock = stock - ?, sales = sales + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ?");
    const updateVariantStock = database.prepare("UPDATE product_variants SET stock = stock - ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND product_id = ? AND stock >= ? AND deleted_at IS NULL");
    const movement = database.prepare("INSERT INTO inventory_movements (product_id, variant_id, type, quantity, location_id, balance_after, reference_type, reference_id, note) VALUES (?, ?, 'sale', ?, 'loc_main', ?, 'order', ?, ?)");
    for (const line of lines) {
      const price = line.variant?.price ?? line.product.price;
      const costPrice = line.variant?.cost_price ?? line.product.cost_price;
      const sku = line.variant?.sku ?? line.product.sku;
      insertItem.run(id, line.product.id, line.variant?.id ?? null, line.variant?.title ?? null, line.product.name, sku, costPrice, price, line.quantity);
      let balanceAfter: number;
      if (line.variant) {
        const stockResult = updateVariantStock.run(line.quantity, line.variant.id, line.product.id, line.quantity);
        if (stockResult.changes !== 1) throw new HttpError(409, `${line.product.name}: variant qoldig‘i o‘zgardi, qayta urinib ko‘ring`);
        balanceAfter = line.variant.stock - line.quantity;
        database.prepare(`
          UPDATE products SET stock = (
            SELECT COALESCE(SUM(stock), 0) FROM product_variants
            WHERE product_id = ? AND deleted_at IS NULL AND status = 'active'
          ), sales = sales + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(line.product.id, line.quantity, line.product.id);
      } else {
        const stockResult = updateStock.run(line.quantity, line.quantity, line.product.id, line.quantity);
        if (stockResult.changes !== 1) throw new HttpError(409, `${line.product.name}: qoldiq o‘zgardi, qayta urinib ko‘ring`);
        balanceAfter = line.product.stock - line.quantity;
      }
      movement.run(line.product.id, line.variant?.id ?? null, -line.quantity, balanceAfter, id, `${id} sotuv`);
    }
    const order = getOrder(id)!;
    writeAudit(context, "order.create", "order", id, undefined, order);
    return order;
  })();
}

const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["paid", "cancelled"],
  paid: ["packing", "cancelled"],
  packing: ["shipping", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function updateOrderStatus(id: string, status: OrderStatus, context: MutationContext = {}) {
  return database.transaction(() => {
    const before = getOrder(id);
    if (!before) return null;
    if (before.status === status) return before;
    if (!allowedOrderTransitions[before.status].includes(status)) {
      throw new HttpError(409, `${before.status} holatidan ${status} holatiga o‘tish mumkin emas`, "INVALID_STATUS_TRANSITION");
    }
    if (status === "cancelled") {
      for (const item of before.items) {
        let balanceAfter: number;
        if (item.variantId) {
          database.prepare("UPDATE product_variants SET stock = stock + ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND product_id = ?").run(item.quantity, item.variantId, item.productId);
          const row = database.prepare("SELECT stock FROM product_variants WHERE id = ?").get(item.variantId) as { stock: number };
          balanceAfter = row.stock;
          database.prepare(`
            UPDATE products SET stock = (
              SELECT COALESCE(SUM(stock), 0) FROM product_variants
              WHERE product_id = ? AND deleted_at IS NULL AND status = 'active'
            ), sales = MAX(0, sales - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).run(item.productId, item.quantity, item.productId);
        } else {
          database.prepare("UPDATE products SET stock = stock + ?, sales = MAX(0, sales - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(item.quantity, item.quantity, item.productId);
          const row = database.prepare("SELECT stock FROM products WHERE id = ?").get(item.productId) as { stock: number };
          balanceAfter = row.stock;
        }
        database.prepare(`
          INSERT INTO inventory_movements (
            product_id, variant_id, type, quantity, location_id, balance_after,
            reference_type, reference_id, actor_user_id, note
          ) VALUES (?, ?, 'return', ?, 'loc_main', ?, 'order_cancel', ?, ?, ?)
        `).run(item.productId, item.variantId ?? null, item.quantity, balanceAfter, id, context.actorUserId ?? null, `${id} bekor qilindi`);
      }
    }
    database.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
    const order = getOrder(id)!;
    writeAudit(context, "order.status.update", "order", id, before, order);
    return order;
  })();
}

export function listInventoryMovements() {
  return database.prepare(`
    SELECT m.id, m.product_id AS productId, p.name AS productName,
      m.variant_id AS variantId, v.title AS variantTitle, m.type, m.quantity,
      COALESCE(l.name, m.location) AS location, m.note, m.balance_after AS balanceAfter,
      m.reference_type AS referenceType, m.reference_id AS referenceId,
      m.created_at AS createdAt
    FROM inventory_movements m JOIN products p ON p.id = m.product_id
    LEFT JOIN product_variants v ON v.id = m.variant_id
    LEFT JOIN inventory_locations l ON l.id = m.location_id
    ORDER BY m.id DESC LIMIT 100
  `).all() as InventoryMovement[];
}

function activeReservedQuantity(productId: string, variantId?: string) {
  const result = database.prepare(`
    SELECT COALESCE(SUM(quantity), 0) AS quantity
    FROM inventory_reservations
    WHERE product_id = ? AND COALESCE(variant_id, '') = COALESCE(?, '') AND status = 'active'
      AND (expires_at IS NULL OR datetime(expires_at) > CURRENT_TIMESTAMP)
  `).get(productId, variantId ?? null) as { quantity: number };
  return result.quantity;
}

export function createInventoryMovement(input: InventoryMovementInput, context: MutationContext = {}) {
  return database.transaction(() => {
    if (input.idempotencyKey) {
      const existing = database.prepare(`
        SELECT m.id, m.product_id AS productId, p.name AS productName,
          m.variant_id AS variantId, v.title AS variantTitle, m.type, m.quantity,
          COALESCE(l.name, m.location) AS location, m.note, m.balance_after AS balanceAfter,
          m.reference_type AS referenceType, m.reference_id AS referenceId,
          m.created_at AS createdAt
        FROM inventory_movements m JOIN products p ON p.id = m.product_id
        LEFT JOIN product_variants v ON v.id = m.variant_id
        LEFT JOIN inventory_locations l ON l.id = m.location_id
        WHERE m.idempotency_key = ?
      `).get(input.idempotencyKey) as InventoryMovement | undefined;
      if (existing) return existing;
    }
    const product = getProduct(input.productId);
    if (!product) throw new HttpError(404, "Mahsulot topilmadi");
    if (product.variants.some((item) => item.status === "active") && !input.variantId) {
      throw new HttpError(422, "Variantli mahsulot uchun variantni tanlang", "VARIANT_REQUIRED", { productId: product.id });
    }
    const location = database.prepare("SELECT id, name FROM inventory_locations WHERE id = ? AND is_active = 1").get(input.locationId) as { id: string; name: string } | undefined;
    if (!location) throw new HttpError(422, "Ombor lokatsiyasi topilmadi", "VALIDATION_ERROR");
    const variant = input.variantId ? product.variants.find((item) => item.id === input.variantId) : undefined;
    if (input.variantId && !variant) throw new HttpError(404, "Mahsulot varianti topilmadi");
    const currentStock = variant?.stock ?? product.stock;
    const nextStock = currentStock + input.quantity;
    const reserved = activeReservedQuantity(input.productId, input.variantId);
    if (nextStock < reserved) {
      throw new HttpError(409, `Qoldiq ${reserved} dona aktiv rezervdan kam bo‘lishi mumkin emas`, "INSUFFICIENT_AVAILABLE_STOCK", { currentStock, reserved });
    }
    if (variant) {
      database.prepare("UPDATE product_variants SET stock = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND product_id = ?").run(nextStock, variant.id, input.productId);
      database.prepare(`
        UPDATE products SET stock = (
          SELECT COALESCE(SUM(stock), 0) FROM product_variants
          WHERE product_id = ? AND deleted_at IS NULL AND status = 'active'
        ), version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(input.productId, input.productId);
    } else {
      database.prepare("UPDATE products SET stock = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nextStock, input.productId);
    }
    const info = database.prepare(`
      INSERT INTO inventory_movements (
        product_id, variant_id, type, quantity, location_id, location, balance_after,
        reference_type, reference_id, idempotency_key, actor_user_id, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.productId,
      input.variantId ?? null,
      input.type,
      input.quantity,
      location.id,
      location.name,
      nextStock,
      input.referenceType ?? null,
      input.referenceId ?? null,
      input.idempotencyKey ?? null,
      context.actorUserId ?? null,
      input.note,
    );
    writeAudit(context, "inventory.adjust", "product", input.productId, { stock: currentStock }, { stock: nextStock, movementId: Number(info.lastInsertRowid) });
    return database.prepare(`
      SELECT m.id, m.product_id AS productId, p.name AS productName,
        m.variant_id AS variantId, v.title AS variantTitle, m.type, m.quantity,
        COALESCE(l.name, m.location) AS location, m.note, m.balance_after AS balanceAfter,
        m.reference_type AS referenceType, m.reference_id AS referenceId,
        m.created_at AS createdAt
      FROM inventory_movements m JOIN products p ON p.id = m.product_id
      LEFT JOIN product_variants v ON v.id = m.variant_id
      LEFT JOIN inventory_locations l ON l.id = m.location_id
      WHERE m.id = ?
    `).get(info.lastInsertRowid) as InventoryMovement;
  })();
}

export function listInventoryReservations() {
  database.prepare("UPDATE inventory_reservations SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE status = 'active' AND expires_at IS NOT NULL AND datetime(expires_at) <= CURRENT_TIMESTAMP").run();
  return database.prepare(`
    SELECT r.id, r.product_id AS productId, p.name AS productName,
      r.variant_id AS variantId, v.title AS variantTitle, r.quantity,
      r.reference_type AS referenceType, r.reference_id AS referenceId,
      r.status, r.expires_at AS expiresAt, r.created_at AS createdAt, r.updated_at AS updatedAt
    FROM inventory_reservations r JOIN products p ON p.id = r.product_id
    LEFT JOIN product_variants v ON v.id = r.variant_id
    ORDER BY r.created_at DESC LIMIT 200
  `).all() as InventoryReservation[];
}

export function createInventoryReservation(input: InventoryReservationInput, context: MutationContext = {}) {
  return database.transaction(() => {
    const product = getProduct(input.productId);
    if (!product) throw new HttpError(404, "Mahsulot topilmadi");
    if (product.variants.some((item) => item.status === "active") && !input.variantId) {
      throw new HttpError(422, "Variantli mahsulot uchun variantni tanlang", "VARIANT_REQUIRED", { productId: product.id });
    }
    const variant = input.variantId ? product.variants.find((item) => item.id === input.variantId) : undefined;
    if (input.variantId && !variant) throw new HttpError(404, "Mahsulot varianti topilmadi");
    const stock = variant?.stock ?? product.stock;
    const reserved = activeReservedQuantity(input.productId, input.variantId);
    if (stock - reserved < input.quantity) {
      throw new HttpError(409, "Rezerv uchun yetarli qoldiq yo‘q", "INSUFFICIENT_AVAILABLE_STOCK", { stock, reserved, available: stock - reserved });
    }
    const id = `res_${randomUUID().slice(0, 12)}`;
    database.prepare(`
      INSERT INTO inventory_reservations (
        id, product_id, variant_id, quantity, reference_type, reference_id, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.productId, input.variantId ?? null, input.quantity, input.referenceType, input.referenceId, input.expiresAt ?? null);
    writeAudit(context, "inventory.reserve", "reservation", id, undefined, input);
    return listInventoryReservations().find((reservation) => reservation.id === id)!;
  })();
}

export function updateInventoryReservationStatus(
  id: string,
  status: "released" | "committed",
  context: MutationContext = {},
) {
  return database.transaction(() => {
    const before = database.prepare("SELECT * FROM inventory_reservations WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!before) return null;
    const result = database.prepare("UPDATE inventory_reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'").run(status, id);
    if (result.changes !== 1) throw new HttpError(409, "Rezerv allaqachon yakunlangan");
    const reservation = listInventoryReservations().find((item) => item.id === id)!;
    writeAudit(context, `inventory.reservation.${status}`, "reservation", id, before, reservation);
    return reservation;
  })();
}

export function getAnalytics(): CommerceAnalytics {
  const totals = database.prepare(`
    SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orderCount
    FROM orders WHERE status != 'cancelled'
  `).get() as { revenue: number; orderCount: number };
  const productTotals = database.prepare(`
    SELECT COALESCE(SUM(sales), 0) AS unitsSold,
      COALESCE(SUM((price - cost_price) * sales), 0) AS profit,
      SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS lowStockCount,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS publishedProducts
    FROM products
  `).get() as Omit<CommerceAnalytics, "revenue" | "orderCount" | "categorySales" | "recentOrders">;
  const categorySales = database.prepare("SELECT category AS name, SUM(sales) AS value FROM products GROUP BY category ORDER BY value DESC").all() as CommerceAnalytics["categorySales"];
  return { ...totals, ...productTotals, categorySales, recentOrders: listOrders({ limit: 6 }) };
}

function defaultReportRange(from?: string, to?: string) {
  const end = to ? new Date(`${to}T00:00:00Z`) : new Date();
  const start = from ? new Date(`${from}T00:00:00Z`) : new Date(end.getTime() - 29 * 86_400_000);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function getSalesReport(options: { from?: string; to?: string; limit?: number } = {}): SalesReport {
  const range = defaultReportRange(options.from, options.to);
  const rangeClause = "created_at >= datetime(?) AND created_at < datetime(?, '+1 day')";
  const orderSummary = database.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS revenue,
      SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) AS orderCount,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN discount ELSE 0 END), 0) AS discountTotal,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders
    FROM orders WHERE ${rangeClause}
  `).get(range.from, range.to) as { revenue: number; orderCount: number; discountTotal: number; cancelledOrders: number };
  const itemSummary = database.prepare(`
    SELECT COALESCE(SUM(oi.quantity), 0) AS unitsSold,
      COALESCE(SUM((oi.price - oi.cost_price) * oi.quantity), 0) AS grossProfit
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND o.created_at >= datetime(?) AND o.created_at < datetime(?, '+1 day')
  `).get(range.from, range.to) as { unitsSold: number; grossProfit: number };
  const dailyOrders = database.prepare(`
    SELECT date(created_at) AS date, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orderCount
    FROM orders WHERE status != 'cancelled' AND ${rangeClause}
    GROUP BY date(created_at) ORDER BY date(created_at)
  `).all(range.from, range.to) as Array<{ date: string; revenue: number; orderCount: number }>;
  const dailyItems = database.prepare(`
    SELECT date(o.created_at) AS date, COALESCE(SUM(oi.quantity), 0) AS unitsSold,
      COALESCE(SUM((oi.price - oi.cost_price) * oi.quantity), 0) AS grossProfit
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND o.created_at >= datetime(?) AND o.created_at < datetime(?, '+1 day')
    GROUP BY date(o.created_at) ORDER BY date(o.created_at)
  `).all(range.from, range.to) as Array<{ date: string; unitsSold: number; grossProfit: number }>;
  const itemByDate = new Map(dailyItems.map((item) => [item.date, item]));
  const daily = dailyOrders.map((item) => ({ ...item, unitsSold: itemByDate.get(item.date)?.unitsSold ?? 0, grossProfit: itemByDate.get(item.date)?.grossProfit ?? 0 }));
  const limit = Math.max(1, Math.min(100, Math.trunc(options.limit ?? 10)));
  const topProducts = database.prepare(`
    SELECT oi.product_id AS productId, MAX(oi.product_name) AS name, MAX(oi.sku) AS sku,
      SUM(oi.quantity) AS quantity, SUM(oi.price * oi.quantity) AS revenue,
      SUM((oi.price - oi.cost_price) * oi.quantity) AS grossProfit
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled' AND o.created_at >= datetime(?) AND o.created_at < datetime(?, '+1 day')
    GROUP BY oi.product_id ORDER BY revenue DESC LIMIT ?
  `).all(range.from, range.to, limit) as SalesReport["topProducts"];
  const categories = database.prepare(`
    SELECT p.category AS name, SUM(oi.quantity) AS quantity, SUM(oi.price * oi.quantity) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id
    WHERE o.status != 'cancelled' AND o.created_at >= datetime(?) AND o.created_at < datetime(?, '+1 day')
    GROUP BY p.category ORDER BY revenue DESC
  `).all(range.from, range.to) as SalesReport["categories"];
  const breakdown = (column: "channel" | "payment" | "status") => database.prepare(`
    SELECT ${column} AS name, COUNT(*) AS orderCount, COALESCE(SUM(total), 0) AS revenue
    FROM orders WHERE ${rangeClause} GROUP BY ${column} ORDER BY revenue DESC
  `).all(range.from, range.to) as Array<{ name: string; orderCount: number; revenue: number }>;
  return {
    range,
    summary: {
      ...orderSummary,
      ...itemSummary,
      averageOrderValue: orderSummary.orderCount > 0 ? Math.round(orderSummary.revenue / orderSummary.orderCount) : 0,
    },
    daily,
    topProducts,
    categories,
    channels: breakdown("channel"),
    payments: breakdown("payment"),
    statuses: breakdown("status"),
  };
}

export function getInventoryReport(lowStockThreshold = 5): InventoryReport {
  const rows = database.prepare(`
    WITH stock_units AS (
      SELECT p.id AS productId, p.name AS productName, p.sku, NULL AS variantId,
        NULL AS variantTitle, p.stock, p.cost_price AS costPrice, p.price
      FROM products p
      WHERE p.deleted_at IS NULL AND NOT EXISTS (
        SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.deleted_at IS NULL AND v.status = 'active'
      )
      UNION ALL
      SELECT p.id, p.name, v.sku, v.id, v.title, v.stock, v.cost_price, v.price
      FROM product_variants v JOIN products p ON p.id = v.product_id
      WHERE p.deleted_at IS NULL AND v.deleted_at IS NULL AND v.status = 'active'
    )
    SELECT s.*,
      COALESCE((SELECT SUM(r.quantity) FROM inventory_reservations r
        WHERE r.product_id = s.productId AND COALESCE(r.variant_id, '') = COALESCE(s.variantId, '')
          AND r.status = 'active' AND (r.expires_at IS NULL OR datetime(r.expires_at) > CURRENT_TIMESTAMP)), 0) AS reserved
    FROM stock_units s ORDER BY s.stock ASC, s.productName
  `).all() as Array<{
    productId: string;
    productName: string;
    sku: string;
    variantId: string | null;
    variantTitle: string | null;
    stock: number;
    costPrice: number;
    price: number;
    reserved: number;
  }>;
  const productCount = new Set(rows.map((row) => row.productId)).size;
  const variantCount = rows.filter((row) => row.variantId).length;
  const unitsOnHand = rows.reduce((sum, row) => sum + row.stock, 0);
  const reservedUnits = rows.reduce((sum, row) => sum + row.reserved, 0);
  const inventoryCostValue = rows.reduce((sum, row) => sum + row.costPrice * row.stock, 0);
  const retailValue = rows.reduce((sum, row) => sum + row.price * row.stock, 0);
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      productCount,
      variantCount,
      unitsOnHand,
      reservedUnits,
      availableUnits: unitsOnHand - reservedUnits,
      inventoryCostValue,
      retailValue,
      potentialGrossProfit: retailValue - inventoryCostValue,
      lowStockCount: rows.filter((row) => row.stock > 0 && row.stock - row.reserved <= lowStockThreshold).length,
      outOfStockCount: rows.filter((row) => row.stock - row.reserved <= 0).length,
    },
    lowStock: rows.filter((row) => row.stock - row.reserved <= lowStockThreshold).slice(0, 100).map((row) => ({
      productId: row.productId,
      productName: row.productName,
      sku: row.sku,
      variantId: row.variantId ?? undefined,
      variantTitle: row.variantTitle ?? undefined,
      stock: row.stock,
      reserved: row.reserved,
      available: row.stock - row.reserved,
    })),
  };
}

export function listAuditLogs(options: { page: number; pageSize: number; entityType?: string; entityId?: string; action?: string }) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  if (options.entityType) { conditions.push("a.entity_type = ?"); values.push(options.entityType); }
  if (options.entityId) { conditions.push("a.entity_id = ?"); values.push(options.entityId); }
  if (options.action) { conditions.push("a.action = ?"); values.push(options.action); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM audit_logs a ${where}`).get(...values) as { count: number }).count;
  const rows = database.prepare(`
    SELECT a.id, a.actor_user_id AS actorUserId, u.name AS actorName, a.action,
      a.entity_type AS entityType, a.entity_id AS entityId, a.before_json AS beforeJson,
      a.after_json AS afterJson, a.request_id AS requestId, a.ip_address AS ipAddress,
      a.created_at AS createdAt
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
    ${where} ORDER BY a.id DESC LIMIT ? OFFSET ?
  `).all(...values, options.pageSize, (options.page - 1) * options.pageSize) as Array<Omit<AuditLog, "before" | "after"> & { beforeJson: string | null; afterJson: string | null }>;
  const logs: AuditLog[] = rows.map(({ beforeJson, afterJson, ...row }) => ({
    ...row,
    before: beforeJson ? JSON.parse(beforeJson) : undefined,
    after: afterJson ? JSON.parse(afterJson) : undefined,
  }));
  const totalPages = Math.max(1, Math.ceil(total / options.pageSize));
  return { logs, pagination: { page: options.page, pageSize: options.pageSize, total, totalPages, hasNextPage: options.page < totalPages, hasPreviousPage: options.page > 1 } satisfies PaginationMeta };
}
